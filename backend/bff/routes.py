# backend/bff/routes.py
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import JSONResponse
from web3 import Web3
from eth_account import Account
from eth_account.messages import encode_typed_data
from backend.auth.deps import get_current_address
from backend.core.config import settings
from backend.services.scorer import calculate_score

router = APIRouter(prefix="/bff", tags=["bff"])

def _chk(addr: str) -> str:
    try:
        is_addr = Web3.is_address(addr) if hasattr(Web3, "is_address") else Web3.isAddress(addr)
    except Exception:
        is_addr = False
    if not is_addr:
        raise HTTPException(status_code=400, detail="Invalid address")
    return Web3.to_checksum_address(addr)

@router.get("/score")
def bff_score(address: str | None = Query(None),
              current: str = Depends(get_current_address)):
    addr = _chk(address or current)
    if addr.lower() != current.lower():
        raise HTTPException(status_code=403, detail="Forbidden: address mismatch")

    result = calculate_score(addr, include_details=True)
    return JSONResponse(content=result.model_dump(exclude_none=True))

@router.get("/score/sign")
def bff_sign_score(score: float = Query(...),
                   address: str | None = Query(None),
                   current: str = Depends(get_current_address)):
    addr = _chk(address or current)
    if addr.lower() != current.lower():
        raise HTTPException(status_code=403, detail="Forbidden: address mismatch")
    if not settings.score_checker_v2_address:
        raise HTTPException(status_code=500, detail="ScoreChecker V2 address not configured")
    if not settings.authorized_signer_private_key:
        raise HTTPException(status_code=500, detail="Signer not configured")

    w3 = Web3(Web3.HTTPProvider(settings.base_rpc_url))
    sc_addr = Web3.to_checksum_address(settings.score_checker_v2_address)
    user = Web3.to_checksum_address(addr)

    # nonce
    nonce = 0
    try:
        minimal_abi = [
            {"inputs":[{"name":"user","type":"address"}],
             "name":"nonces","outputs":[{"type":"uint256"}],
             "stateMutability":"view","type":"function"}
        ]
        c = w3.eth.contract(address=sc_addr, abi=minimal_abi)
        nonce = int(c.functions.nonces(user).call())
    except Exception:
        nonce = 0

    issued_at = int(w3.eth.get_block('latest').timestamp)
    score_int = max(0, min(1_000_000, int(round(float(score)))))

    domain = {
        "name": "BaseBadgeScore",
        "version": "1",
        "chainId": settings.chain_id,
        "verifyingContract": sc_addr,
    }
    types = {
        "Score": [
            {"name": "user", "type": "address"},
            {"name": "score", "type": "uint256"},
            {"name": "issuedAt", "type": "uint256"},
            {"name": "nonce", "type": "uint256"},
        ]
    }
    value = {
        "user": user,
        "score": score_int,
        "issuedAt": issued_at,
        "nonce": nonce,
    }
    msg = encode_typed_data(full_message={
        "types": {"EIP712Domain": [
            {"name": "name", "type": "string"},
            {"name": "version", "type": "string"},
            {"name": "chainId", "type": "uint256"},
            {"name": "verifyingContract", "type": "address"},
        ], **types},
        "domain": domain, "primaryType": "Score", "message": value
    })

    acct = Account.from_key(settings.authorized_signer_private_key)
    sig = acct.sign_message(msg).signature.hex()
    if not sig.startswith("0x"):
        sig = "0x" + sig

    return JSONResponse(content={
        "score": score_int,
        "issuedAt": issued_at,
        "nonce": nonce,
        "signature": sig,
    })

@router.get("/score/sign_card")
def bff_sign_score_card(
    total_score: float = Query(...),
    base_score: float = Query(...),
    security_score: float = Query(...),
    tx_count: int = Query(...),
    current_streak: int = Query(...),
    max_streak: int = Query(...),
    current_balance: float = Query(..., description="in ETH"),
    avg_balance_last_month: float = Query(..., description="in ETH"),
    gas_paid: float = Query(..., description="in ETH"),
    suspicious_tokens: int = Query(...),
    suspicious_contracts: int = Query(...),
    dangerous_interactions: int = Query(...),
    suspicious_nfts: int = Query(...),
    address: str | None = Query(None),
    current: str = Depends(get_current_address),
):
    addr = _chk(address or current)
    if addr.lower() != current.lower():
        raise HTTPException(status_code=403, detail="Forbidden: address mismatch")
    if not settings.score_checker_v2_address:
        raise HTTPException(status_code=500, detail="ScoreChecker V2 address not configured")
    if not settings.authorized_signer_private_key:
        raise HTTPException(status_code=500, detail="Signer not configured")

    w3 = Web3(Web3.HTTPProvider(settings.base_rpc_url))
    sc_addr = Web3.to_checksum_address(settings.score_checker_v2_address)
    user = Web3.to_checksum_address(addr)

    # nonce
    nonce = 0
    try:
        minimal_abi = [
            {"inputs":[{"name":"user","type":"address"}],
             "name":"nonces","outputs":[{"type":"uint256"}],
             "stateMutability":"view","type":"function"}
        ]
        c = w3.eth.contract(address=sc_addr, abi=minimal_abi)
        nonce = int(c.functions.nonces(user).call())
    except Exception:
        nonce = 0

    issued_at = int(w3.eth.get_block('latest').timestamp)
    total_score_int    = int(round(float(total_score)))
    base_score_int     = int(round(float(base_score)))
    security_score_int = int(round(float(security_score)))
    current_balance_wei = int(current_balance * 1e18)
    avg_balance_wei     = int(avg_balance_last_month * 1e18)
    gas_paid_wei        = int(gas_paid * 1e18)

    domain = {"name":"BaseBadgeScore","version":"1","chainId":settings.chain_id,"verifyingContract":sc_addr}
    types = {
        "ScoreCard": [
            {"name":"user","type":"address"},
            {"name":"totalScore","type":"uint256"},
            {"name":"baseScore","type":"uint256"},
            {"name":"securityScore","type":"uint256"},
            {"name":"numberOfTransactions","type":"uint256"},
            {"name":"currentStreak","type":"uint256"},
            {"name":"maxStreak","type":"uint256"},
            {"name":"currentBalance","type":"uint256"},
            {"name":"avgBalanceLastMonth","type":"uint256"},
            {"name":"gasPaid","type":"uint256"},
            {"name":"suspiciousTokens","type":"uint256"},
            {"name":"suspiciousContracts","type":"uint256"},
            {"name":"dangerousInteractions","type":"uint256"},
            {"name":"suspiciousOilCompanies","type":"uint256"},
            {"name":"issuedAt","type":"uint256"},
            {"name":"nonce","type":"uint256"},
        ]
    }
    value = {
        "user": user,
        "totalScore": total_score_int,
        "baseScore": base_score_int,
        "securityScore": security_score_int,
        "numberOfTransactions": tx_count,
        "currentStreak": current_streak,
        "maxStreak": max_streak,
        "currentBalance": current_balance_wei,
        "avgBalanceLastMonth": avg_balance_wei,
        "gasPaid": gas_paid_wei,
        "suspiciousTokens": suspicious_tokens,
        "suspiciousContracts": suspicious_contracts,
        "dangerousInteractions": dangerous_interactions,
        "suspiciousOilCompanies": suspicious_nfts,
        "issuedAt": issued_at,
        "nonce": nonce,
    }
    msg = encode_typed_data(full_message={
        "types": {"EIP712Domain": [
            {"name":"name","type":"string"},
            {"name":"version","type":"string"},
            {"name":"chainId","type":"uint256"},
            {"name":"verifyingContract","type":"address"},
        ], **types},
        "domain": domain, "primaryType": "ScoreCard", "message": value
    })

    acct = Account.from_key(settings.authorized_signer_private_key)
    sig = acct.sign_message(msg).signature.hex()
    if not sig.startswith("0x"):
        sig = "0x" + sig

    return JSONResponse(content={
        "totalScore": total_score_int,
        "baseScore": base_score_int,
        "securityScore": security_score_int,
        "numberOfTransactions": tx_count,
        "currentStreak": current_streak,
        "maxStreak": max_streak,
        "currentBalance": current_balance_wei,
        "avgBalanceLastMonth": avg_balance_wei,
        "gasPaid": gas_paid_wei,
        "suspiciousTokens": suspicious_tokens,
        "suspiciousContracts": suspicious_contracts,
        "dangerousInteractions": dangerous_interactions,
        "suspiciousOilCompanies": suspicious_nfts,
        "issuedAt": issued_at,
        "nonce": nonce,
        "signature": sig,
    })

