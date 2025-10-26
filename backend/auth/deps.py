# backend/auth/deps.py
import jwt, string
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from backend.core.config import settings

bearer = HTTPBearer(auto_error=False)
_HEX = set(string.hexdigits)  # 0-9a-fA-F

def _is_hex_address(addr: str) -> bool:
    return (
        isinstance(addr, str)
        and addr.startswith("0x")
        and len(addr) == 42
        and all(c in _HEX for c in addr[2:])
    )

def get_current_address(creds: HTTPAuthorizationCredentials = Depends(bearer)) -> str:
    if not creds or not creds.credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing token")

    token = creds.credentials
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=["HS256"],
            options={"require": ["exp", "sub", "iss", "iat"]},
            audience="basebadge-app",
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    iss = payload.get("iss")
    if iss != "basebadge-auth":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token issuer")

    addr = payload.get("sub")
    if not _is_hex_address(addr):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token subject")

    return addr.lower()

def require_admin(current: str = Depends(get_current_address)) -> str:
    admins = {a.lower() for a in (settings.admin_addresses or [])}
    if settings.authorized_signer_address:
        admins.add(settings.authorized_signer_address.lower())
    if current.lower() not in admins:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin only")
    return current

def get_optional_address(creds: HTTPAuthorizationCredentials = Depends(bearer)) -> str | None:
    # For dev/ENFORCE_AUTH=false
    if not creds or not creds.credentials:
        return None
    token = creds.credentials
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=["HS256"],
            options={"require": ["exp", "sub", "iss", "iat"]},
            audience="basebadge-app",
        )
        if payload.get("iss") != "basebadge-auth":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token issuer")
        addr = payload.get("sub")
        if not _is_hex_address(addr):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token subject")
        return addr.lower()
    except Exception:
        if settings.enforce_auth:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        return None