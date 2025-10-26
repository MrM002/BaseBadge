# backend/auth/service.py
import os, time, base64
from typing import Dict, Tuple
from web3 import Web3
from eth_account.messages import encode_defunct
from eth_account import Account
import jwt

JWT_ALG = "HS256"
# in-memory nonce store (MVP). If you run multiple API replicas later, move this to Redis.
_NONCES: Dict[str, Tuple[str, float]] = {}
# Simple rate limiting: track failed attempts per address
_FAILED_ATTEMPTS: Dict[str, Tuple[int, float]] = {}  # address -> (count, reset_time)

def _now() -> float:
    return time.time()

def _ttl(seconds: int = 600) -> float:
    return _now() + seconds

def _rand_nonce() -> str:
    return base64.urlsafe_b64encode(os.urandom(24)).decode("utf-8").rstrip("=")

def _cleanup_expired_nonces():
    """Clean up expired nonces to prevent memory leaks"""
    now = _now()
    expired = [addr for addr, (_, exp) in _NONCES.items() if now > exp]
    for addr in expired:
        _NONCES.pop(addr, None)


def _check_rate_limit(address: str) -> None:
    """Check if address has exceeded rate limit for failed attempts"""
    addr_lower = address.lower()
    now = _now()
    
    if addr_lower in _FAILED_ATTEMPTS:
        count, reset_time = _FAILED_ATTEMPTS[addr_lower]
        if now > reset_time:
            # Reset window
            _FAILED_ATTEMPTS.pop(addr_lower, None)
        elif count >= 5:  # Max 5 failed attempts per hour
            raise ValueError("Too many failed attempts. Please try again later.")

def _record_failed_attempt(address: str) -> None:
    """Record a failed authentication attempt"""
    addr_lower = address.lower()
    now = _now()
    
    if addr_lower in _FAILED_ATTEMPTS:
        count, reset_time = _FAILED_ATTEMPTS[addr_lower]
        if now > reset_time:
            # Reset window
            _FAILED_ATTEMPTS[addr_lower] = (1, now + 3600)  # 1 hour
        else:
            _FAILED_ATTEMPTS[addr_lower] = (count + 1, reset_time)
    else:
        _FAILED_ATTEMPTS[addr_lower] = (1, now + 3600)  # 1 hour

def _clear_failed_attempts(address: str) -> None:
    """Clear failed attempts for successful authentication"""
    addr_lower = address.lower()
    _FAILED_ATTEMPTS.pop(addr_lower, None)


def create_login_nonce(address: str) -> str:
    addr = Web3.to_checksum_address(address)
     # Clean up expired nonces before creating new one
    _cleanup_expired_nonces()
    nonce = f"BaseBadge login for {addr} :: {_rand_nonce()} :: {int(_now())}"
    _NONCES[addr.lower()] = (nonce, _ttl(600))  # 10 min
    return nonce

def verify_and_issue_token(address: str, signature: str, jwt_secret: str, jwt_ttl_seconds: int = 86400) -> str:
    addr = Web3.to_checksum_address(address)
    # Clean up expired nonces before verifying
    _cleanup_expired_nonces()
    rec = _NONCES.get(addr.lower())
    if not rec:
        _record_failed_attempt(addr)
        raise ValueError("Nonce not found or expired")
    nonce, exp_at = rec
    if _now() > exp_at:
        _NONCES.pop(addr.lower(), None)
        _record_failed_attempt(addr)
        raise ValueError("Nonce expired")
    
    # Validate signature format
    if not signature.startswith("0x") or len(signature) != 132:
        _record_failed_attempt(addr)
        raise ValueError("Invalid signature format")

    msg = encode_defunct(text=nonce)
    try:
        recovered = Account.recover_message(msg, signature=signature)
        if recovered.lower() != addr.lower():
            _record_failed_attempt(addr)
            raise ValueError("Invalid signature")
    except Exception as e:
        _record_failed_attempt(addr)
        raise ValueError(f"Signature verification failed: {str(e)}")

    _clear_failed_attempts(addr)

    # Remove used nonce immediately
    _NONCES.pop(addr.lower(), None)
    # Create JWT token
    now = int(_now())
    payload = {
        "sub": addr, 
        "iat": now, 
        "exp": now + jwt_ttl_seconds, 
        "iss": "basebadge-auth",
        "aud": "basebadge-app"  # Add audience for additional security
    }
    token = jwt.encode(payload, jwt_secret, algorithm=JWT_ALG)
    if isinstance(token, bytes):
        token = token.decode("utf-8")
    return token
