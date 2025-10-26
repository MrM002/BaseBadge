
import os
import glob
import json
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Dict, Any
from pathlib import Path as _Path
from eth_account import Account
from eth_account.messages import encode_typed_data
from web3 import Web3
from fastapi import APIRouter, Depends, Response ,Query, HTTPException
from fastapi.responses import JSONResponse
from backend.services.scorer import calculate_score, derive_badges_from_score
from backend.models.profile import UserProfile
from backend.utils.wallet import resolve_input_basename_address, resolve_address_to_basename, resolve_basename_avatar
from backend.core.config import settings
from backend.auth.deps import get_current_address, get_optional_address, require_admin

router = APIRouter()

# --- address validation helper ---
def _validate_eth_address(addr: str) -> str:
    if not isinstance(addr, str):
        raise HTTPException(status_code=400, detail="Invalid address")
    try:
        is_addr = Web3.is_address(addr) if hasattr(Web3, "is_address") else Web3.isAddress(addr)
    except Exception:
        is_addr = False
    if not is_addr:
        raise HTTPException(status_code=400, detail="Invalid address")
    return Web3.to_checksum_address(addr)

# Load V2 contract ABI and address
_CONTRACT_V2_JSON_PATH = _Path(__file__).parent.parent / "contracts" / "ScoreCheckerV2.json"
_SCORECHECKER_V2_ABI: list | None = None
_SCORECHECKER_V2_ADDR: str | None = None

try:
    if _CONTRACT_V2_JSON_PATH.exists():
        with open(_CONTRACT_V2_JSON_PATH, 'r', encoding='utf-8') as _f:
            _j = json.load(_f)
            _SCORECHECKER_V2_ABI = _j.get('abi') or None
            _addr = _j.get('address')
            if isinstance(_addr, str) and _addr.startswith('0x') and len(_addr) == 42:
                _SCORECHECKER_V2_ADDR = _addr
except Exception:
    _SCORECHECKER_V2_ABI = None
    _SCORECHECKER_V2_ADDR = None

# Fallback to settings if JSON file not found
if not _SCORECHECKER_V2_ADDR:
    _SCORECHECKER_V2_ADDR = settings.score_checker_v2_address

# Optional: load ABI/address from backend/contracts/ScoreChecker.json if present (legacy)
_CONTRACT_JSON_PATH = _Path(__file__).parent.parent / "contracts" / "ScoreChecker.json"
_SCORECHECKER_ABI: list | None = None
_SCORECHECKER_ADDR_FROM_JSON: str | None = None
try:
    if _CONTRACT_JSON_PATH.exists():
        with open(_CONTRACT_JSON_PATH, 'r', encoding='utf-8') as _f:
            _j = json.load(_f)
            _SCORECHECKER_ABI = _j.get('abi') or None
            _addr = _j.get('address')
            if isinstance(_addr, str) and _addr.startswith('0x') and len(_addr) == 42:
                _SCORECHECKER_ADDR_FROM_JSON = _addr
except Exception:
    _SCORECHECKER_ABI = None
    _SCORECHECKER_ADDR_FROM_JSON = None

def get_persistent_stats_file():
    """Get the path to the persistent stats file"""
    base_dir = Path(__file__).parent.parent.parent
    return base_dir / "data" / "persistent_stats.json"


# --- Simple score history persistence (file-based) ---
def get_score_history_file():
    base_dir = Path(__file__).parent.parent.parent
    return base_dir / "data" / "score_history.json"

def append_score_history(entry: Dict[str, Any]):
    file_path = get_score_history_file()
    file_path.parent.mkdir(parents=True, exist_ok=True)
    history: List[Dict[str, Any]] = []
    if file_path.exists():
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                history = json.load(f)
        except Exception:
            history = []
    history.append(entry)
    # keep recent 1000 entries only
    history = history[-1000:]
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(history, f, indent=2)

def get_recent_history(address: str, limit: int = 30) -> List[Dict[str, Any]]:
    file_path = get_score_history_file()
    if not file_path.exists():
        return []
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            history: List[Dict[str, Any]] = json.load(f)
        filtered = [h for h in history if h.get('address', '').lower() == address.lower()]
        return filtered[-limit:]
    except Exception:
        return []

def get_user_dashboard_file():
    base_dir = Path(__file__).parent.parent.parent
    return base_dir / "data" / "user_dashboards.json"

def save_user_dashboard(address: str, dashboard_data: Dict[str, Any]):
    """Save user dashboard data for quick access"""
    file_path = get_user_dashboard_file()
    file_path.parent.mkdir(parents=True, exist_ok=True)
    
    dashboards: Dict[str, Any] = {}
    if file_path.exists():
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                dashboards = json.load(f)
        except Exception:
            dashboards = {}
    
    # Update user dashboard data
    dashboards[address.lower()] = {
        **dashboard_data,
        "last_updated": datetime.now().isoformat(),
        "address": address
    }
    
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(dashboards, f, indent=2)

def get_user_dashboard(address: str) -> Dict[str, Any] | None:
    """Get cached user dashboard data"""
    file_path = get_user_dashboard_file()
    if not file_path.exists():
        return None
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            dashboards = json.load(f)
        return dashboards.get(address.lower())
    except Exception:
        return None

def load_persistent_stats():
    """Load persistent stats from JSON file"""
    stats_file = get_persistent_stats_file()
    if stats_file.exists():
        try:
            with open(stats_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading persistent stats: {e}")
    return {
        "total_wallets_analyzed": 0,
        "last_updated": datetime.now().isoformat()
    }

def save_persistent_stats(stats_data):
    """Save persistent stats to JSON file"""
    try:
        stats_file = get_persistent_stats_file()
        stats_file.parent.mkdir(parents=True, exist_ok=True)
        with open(stats_file, 'w', encoding='utf-8') as f:
            json.dump(stats_data, f, indent=2)
    except Exception as e:
        print(f"Error saving persistent stats: {e}")

def update_wallets_analyzed_count():
    """Update the persistent wallets analyzed count based on current CSV files"""
    base_dir = Path(__file__).parent.parent.parent
    security_reports_dir = base_dir / "data" / "security_reports"
    
    # Load current persistent stats
    persistent_stats = load_persistent_stats()
    current_total = persistent_stats.get("total_wallets_analyzed", 0)
    
    if security_reports_dir.exists():
        # Count unique wallet addresses from current CSV files
        wallet_addresses = set()
        
        for file_path in security_reports_dir.glob("*.csv"):
            try:
                filename = file_path.name
                if '_' in filename:
                    parts_filename = filename.split('_')
                    if len(parts_filename) >= 3:
                        address = parts_filename[2]
                        if address.startswith('0x') and len(address) >= 42:
                            wallet_addresses.add(address)
            except Exception as e:
                print(f"Error reading file {file_path}: {e}")
                continue
        
        current_analyzed = len(wallet_addresses)
        
        # Only update if we have more wallets than before
        if current_analyzed > current_total:
            persistent_stats["total_wallets_analyzed"] = current_analyzed
            persistent_stats["last_updated"] = datetime.now().isoformat()
            save_persistent_stats(persistent_stats)
            return current_analyzed
    
    return current_total


@router.get("/score")
def score_endpoint(
    address: str = Query(..., description="The address to calculate the score for"),
    details: bool = Query(True, description="Whether to include detailed information in the response"),
    admin: str = Depends(require_admin),
):
    # --- Auth & address enforcement ---
    addr = _validate_eth_address(address)
    
    # Rate limiting for admin endpoints
    if not hasattr(score_endpoint, '_last_call'):
        score_endpoint._last_call = 0
    import time
    current_time = time.time()
    if current_time - score_endpoint._last_call < 1:  # 1 second between calls
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
    score_endpoint._last_call = current_time

    try:
        result = calculate_score(addr, include_details=details)

        if details:
            dashboard_data = {
                "lastScores": {
                    "total_score": result.total_score,
                    "base_score": result.base_score or (result.base.base_score if result.base else 0.0),
                    "security_score": result.security_score or (result.security.security_score if result.security else 0.0),
                    "date": datetime.now().isoformat(),
                },
                "scoreHistory": get_recent_history(addr),
                "badges": derive_badges_from_score(addr, result),
            }
            save_user_dashboard(addr, dashboard_data)

            try:
                persistent_stats = load_persistent_stats()
                current_wallets = persistent_stats.get("wallets_analyzed", 0)
                recent_history = get_recent_history(addr, limit=1)
                if not recent_history:
                    persistent_stats["wallets_analyzed"] = current_wallets + 1
                    persistent_stats["total_wallets_analyzed"] = current_wallets + 1
                    persistent_stats["last_updated"] = datetime.now().isoformat()
                    save_persistent_stats(persistent_stats)
                    print(f"New wallet analyzed: {addr}. Total wallets: {persistent_stats['wallets_analyzed']}")
            except Exception as e:
                print(f"Error updating wallets count: {e}")

        return JSONResponse(content=result.model_dump(exclude_none=True))
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": "Failed to calculate score", "details": str(e)})



@router.get("/stats")
def stats_endpoint():
    """Get live statistics for the BaseBadge platform"""
    
    # Load current persistent stats
    persistent_stats = load_persistent_stats()
    
    # Get wallets analyzed count (prefer persistent stats, fallback to CSV counting)
    analyzed_wallets = persistent_stats.get("wallets_analyzed", 0)
    if analyzed_wallets == 0:
        analyzed_wallets = update_wallets_analyzed_count()
        # Update persistent stats if we got a new count
        if analyzed_wallets > 0:
            persistent_stats["wallets_analyzed"] = analyzed_wallets
            persistent_stats["total_wallets_analyzed"] = analyzed_wallets
            save_persistent_stats(persistent_stats)
    
    # Count current CSV files for recent activity
    base_dir = Path(__file__).parent.parent.parent
    security_reports_dir = base_dir / "data" / "security_reports"
    total_reports = 0
    recent_activity = 0
    
    if security_reports_dir.exists():
        current_time = datetime.now()
        
        for file_path in security_reports_dir.glob("*.csv"):
            try:
                file_time = datetime.fromtimestamp(file_path.stat().st_mtime)
                # Check if file is from last 24 hours
                if current_time - file_time < timedelta(hours=24):
                    recent_activity += 1
                total_reports += 1
            except Exception as e:
                print(f"Error reading file {file_path}: {e}")
                continue
    
    # Use persistent stats values or calculate defaults
    accuracy_rate = persistent_stats.get("accuracy_rate", 95.0)
    security_checks = persistent_stats.get("security_checks", 4)
    monitoring_active = persistent_stats.get("monitoring_active", recent_activity > 0)
    avg_score = persistent_stats.get("avg_trust_score", 75.0)
    total_badges = persistent_stats.get("total_badges_earned", analyzed_wallets * 2)
    
    # Calculate some basic stats
    stats = {
        "wallets_analyzed": analyzed_wallets,
        "accuracy_rate": round(accuracy_rate, 1),
        "security_checks": security_checks,
        "monitoring_active": monitoring_active,
        "total_reports": total_reports,
        "recent_activity_24h": recent_activity,
        "avg_trust_score": round(avg_score, 1),
        "total_badges_earned": total_badges,
        "last_updated": datetime.now().isoformat()
    }
    
    return JSONResponse(content=stats)


# New endpoints to back Dashboard/Badge/Settings pages

def _read_onchain_last_score(address: str) -> Dict[str, int] | None:
    """Read latest score from on-chain ScoreChecker V2.
    Returns {"score": int, "timestamp": int} or None on failure.
    """
    try:
        # Use V2 contract
        sc_addr_raw = _SCORECHECKER_V2_ADDR or settings.score_checker_v2_address
        if not sc_addr_raw:
            return None
        if not settings.base_rpc_url:
            return None
            
        # Create web3 provider with retry mechanism and timeout
        from requests.adapters import HTTPAdapter
        from urllib3.util import Retry
        import requests
        
        session = requests.Session()
        # Configure retry strategy with backoff
        retry_strategy = Retry(
            total=3,  # Maximum number of retries
            backoff_factor=0.5,  # Backoff factor for retry delay
            status_forcelist=[429, 500, 502, 503, 504],  # Retry on these status codes
            allowed_methods=["HEAD", "GET", "POST"]  # Methods to retry
        )
        adapter = HTTPAdapter(max_retries=retry_strategy)
        session.mount("http://", adapter)
        session.mount("https://", adapter)
        
        # Create provider with custom session and longer timeout
        provider = Web3.HTTPProvider(
            settings.base_rpc_url,
            request_kwargs={'timeout': 10},  # 10 second timeout
            session=session
        )
        w3 = Web3(provider)
        sc_addr = Web3.to_checksum_address(sc_addr_raw)
        user = Web3.to_checksum_address(address)
        
        # Try raw call first as it's more reliable
        try:
            # Use the getScore function selector
            function_selector = w3.keccak(text="getScore(address)")[:4]
            # Encode the address parameter
            encoded_address = user[2:].rjust(64, '0')  # Remove 0x and pad to 32 bytes
            call_data = function_selector + bytes.fromhex(encoded_address)
            
            # Make the call
            raw_result = w3.eth.call({
                'to': sc_addr,
                'data': '0x' + call_data.hex()
            })
            
            # Decode the result manually
            if len(raw_result) >= 64:  # 2 * 32 bytes
                score = int.from_bytes(raw_result[0:32], byteorder='big')
                timestamp = int.from_bytes(raw_result[32:64], byteorder='big')
                return {"score": score, "timestamp": timestamp}
                
        except Exception as raw_err:
            print(f"Raw call error for getScore: {raw_err}")
            # Don't immediately fail - try the ABI method
        
        # Fallback to ABI method
        try:
            # Use V2 ABI
            abi = _SCORECHECKER_V2_ABI or [
                {"inputs": [{"name": "user", "type": "address"}], "name": "getScore", "outputs": [
                    {"name": "score", "type": "uint256"}, {"name": "timestamp", "type": "uint256"}
                ], "stateMutability": "view", "type": "function"},
            ]
            c = w3.eth.contract(address=sc_addr, abi=abi)
            res = c.functions.getScore(user).call()
            if isinstance(res, (list, tuple)) and len(res) == 2:
                return {"score": int(res[0]), "timestamp": int(res[1])}
        except Exception as abi_err:
            print(f"ABI call error for getScore: {abi_err}")
            
        return None
    except Exception as e:
        print(f"Error reading on-chain score: {e}")
        return None

def _read_onchain_score_card(address: str) -> Dict[str, Any] | None:
    """Read full score card from on-chain ScoreChecker V2.
    Returns full score card data or None on failure.
    """
    try:
        # Use V2 contract
        sc_addr_raw = _SCORECHECKER_V2_ADDR or settings.score_checker_v2_address
        if not sc_addr_raw:
            return None
        if not settings.base_rpc_url:
            return None
            
        # Create web3 provider with retry mechanism and timeout
        from requests.adapters import HTTPAdapter
        from urllib3.util import Retry
        import requests
        
        session = requests.Session()
        # Configure retry strategy with backoff
        retry_strategy = Retry(
            total=3,  # Maximum number of retries
            backoff_factor=0.5,  # Backoff factor for retry delay
            status_forcelist=[429, 500, 502, 503, 504],  # Retry on these status codes
            allowed_methods=["HEAD", "GET", "POST"]  # Methods to retry
        )
        adapter = HTTPAdapter(max_retries=retry_strategy)
        session.mount("http://", adapter)
        session.mount("https://", adapter)
        
        # Create provider with custom session and longer timeout
        provider = Web3.HTTPProvider(
            settings.base_rpc_url,
            request_kwargs={'timeout': 10},  # 10 second timeout
            session=session
        )
        w3 = Web3(provider)
        sc_addr = Web3.to_checksum_address(sc_addr_raw)
        user = Web3.to_checksum_address(address)
        
        # Try raw call first as it's more reliable
        try:
            # Use the getScoreCard function selector
            function_selector = w3.keccak(text="getScoreCard(address)")[:4]
            # Encode the address parameter
            encoded_address = user[2:].rjust(64, '0')  # Remove 0x and pad to 32 bytes
            call_data = function_selector + bytes.fromhex(encoded_address)
            
            # Make the call
            raw_result = w3.eth.call({
                'to': sc_addr,
                'data': '0x' + call_data.hex()
            })
            
            # Decode the result manually
            if len(raw_result) >= 480:  # 15 * 32 bytes
                values = []
                for i in range(15):
                    start = i * 32
                    end = start + 32
                    value = int.from_bytes(raw_result[start:end], byteorder='big')
                    values.append(value)
                
                return {
                    "totalScore": values[0],
                    "baseScore": values[1],
                    "securityScore": values[2],
                    "numberOfTransactions": values[3],
                    "currentStreak": values[4],
                    "maxStreak": values[5],
                    "currentBalance": values[6],
                    "avgBalanceLastMonth": values[7],
                    "gasPaid": values[8],
                    "suspiciousTokens": values[9],
                    "suspiciousContracts": values[10],
                    "dangerousInteractions": values[11],
                    "suspiciousNfts": values[12],
                    "lastCheckTime": values[13],
                    "lastIssuedAt": values[14]
                }
            
        except Exception as raw_err:
            print(f"Raw call error: {raw_err}")
            # Don't immediately fail - try the ABI method
            
        # Fallback to ABI method if available
        if _SCORECHECKER_V2_ABI:
            c = w3.eth.contract(address=sc_addr, abi=_SCORECHECKER_V2_ABI)
            try:
                result = c.functions.getScoreCard(user).call()
                
                if result and len(result) >= 15:
                    return {
                        "totalScore": int(result[0]),
                        "baseScore": int(result[1]),
                        "securityScore": int(result[2]),
                        "numberOfTransactions": int(result[3]),
                        "currentStreak": int(result[4]),
                        "maxStreak": int(result[5]),
                        "currentBalance": int(result[6]),
                        "avgBalanceLastMonth": int(result[7]),
                        "gasPaid": int(result[8]),
                        "suspiciousTokens": int(result[9]),
                        "suspiciousContracts": int(result[10]),
                        "dangerousInteractions": int(result[11]),
                        "suspiciousNfts": int(result[12]),
                        "lastCheckTime": int(result[13]),
                        "lastIssuedAt": int(result[14])
                    }
            except Exception as abi_err:
                print(f"ABI call error: {abi_err}")
                # Both methods failed
        
        return None
    except Exception as e:
        print(f"Error reading on-chain score card: {e}")
        return None


@router.get("/onchain/score")
def get_onchain_score(
    address: str = Query(..., description="Wallet address"),
    current: str | None = Depends(get_optional_address),
):
    """Get score data directly from on-chain. No fallback to backend calculations."""
    # --- Auth & address enforcement  ---
    if settings.enforce_auth:
        if current is None:
            raise HTTPException(status_code=401, detail="Missing token")
        addr = _validate_eth_address(address)
        if addr.lower() != current.lower():
            raise HTTPException(status_code=403, detail="Forbidden: address mismatch")
    else:
        addr = _validate_eth_address(address)


    try:
        score_data = _read_onchain_last_score(addr)
        if not score_data:
            return JSONResponse(status_code=404, content={"error": "No on-chain score found for this address"})
        score_card = _read_onchain_score_card(addr)
        if score_card:
            return JSONResponse(content={
                "address": addr,
                "total_score": score_card["totalScore"],
                "base_score": score_card["baseScore"],
                "security_score": score_card["securityScore"],
                "timestamp": score_data["timestamp"],
                "base": {
                    "tx_count": score_card["numberOfTransactions"],
                    "gas_used": score_card["gasPaid"],
                    "current_balance": score_card["currentBalance"] / 1e18,
                    "past_balance": score_card["avgBalanceLastMonth"] / 1e18,
                    "current_streak": score_card["currentStreak"],
                    "max_streak": score_card["maxStreak"],
                    "age_days": 0,
                    "base_score": score_card["baseScore"]
                },
                "security": {
                    "risky_tokens": score_card["suspiciousTokens"],
                    "risky_contracts": score_card["suspiciousContracts"],
                    "risky_signs": score_card["dangerousInteractions"],
                    "suspicious_nfts": score_card["suspiciousNfts"],
                    "security_score": score_card["securityScore"]
                }
            })
        else:
            return JSONResponse(content={
                "address": addr,
                "total_score": score_data["score"],
                "timestamp": score_data["timestamp"],
                "base_score": 0,
                "security_score": 0,
                "base": {
                    "tx_count": 0, "gas_used": 0, "current_balance": 0, "past_balance": 0,
                    "current_streak": 0, "max_streak": 0, "age_days": 0, "base_score": 0
                },
                "security": {
                    "risky_tokens": 0,
                    "risky_contracts": 0,
                    "risky_signs": 0,
                    "suspicious_nfts": 0,
                    "security_score": 0
                }
            })
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": f"Failed to read on-chain data: {str(e)}"})



@router.get("/dashboard/summary")
def dashboard_summary(
    address: str | None = Query(None),
    current: str | None = Depends(get_optional_address),
):
    """
    Get dashboard summary. ALWAYS reads from on-chain first.
    Secured: requires Authorization and enforces address = token.sub (when ENFORCE_AUTH=true)
    """
    # --- Auth & address enforcement ---
    if settings.enforce_auth:
        if current is None:
            raise HTTPException(status_code=401, detail="Missing token")
        if address is None:
            addr = current
        else:
            addr_c = _validate_eth_address(address)
            if addr_c.lower() != current.lower():
                raise HTTPException(status_code=403, detail="Forbidden: address mismatch")
            addr = addr_c
    else:
        # Not recommended, but keeps backward-compat if ENFORCE_AUTH=false
        if address:
            addr = _validate_eth_address(address)
        elif current:
            addr = _validate_eth_address(current)
        else:
            raise HTTPException(status_code=400, detail="Address required")

    try:
        # ALWAYS try to read from on-chain first
        onchain = _read_onchain_last_score(addr)
        onchain_card = _read_onchain_score_card(addr)

        if onchain and onchain.get("timestamp", 0) > 0:
            # We have on-chain data - use it exclusively
            if onchain_card:
                total_score = float(onchain_card["totalScore"])
                base_score = float(onchain_card["baseScore"])
                security_score = float(onchain_card["securityScore"])

                from backend.models.score import ScoreResponse, ScoreBreakdown, SecurityBreakdown
                score_for_badges = ScoreResponse(
                    basename=None,
                    address=addr,
                    total_score=total_score,
                    base_score=base_score,
                    security_score=security_score,
                    base=ScoreBreakdown(
                        tx_count=onchain_card["numberOfTransactions"],
                        gas_used=float(onchain_card["gasPaid"]),
                        current_balance=float(onchain_card["currentBalance"]) / 1e18,
                        past_balance=float(onchain_card["avgBalanceLastMonth"]) / 1e18,
                        current_streak=onchain_card["currentStreak"],
                        max_streak=onchain_card["maxStreak"],
                        age_days=0,
                        base_score=base_score
                    ),
                    security=SecurityBreakdown(
                        risky_tokens=onchain_card["suspiciousTokens"],
                        risky_contracts=onchain_card["suspiciousContracts"],
                        risky_signs=onchain_card["dangerousInteractions"],
                        suspicious_nfts=onchain_card["suspiciousNfts"],
                        security_score=security_score
                    )
                )
            else:
                total_score = float(onchain["score"])
                base_score = 0.0
                security_score = 0.0

                from backend.models.score import ScoreResponse
                score_for_badges = ScoreResponse(
                    basename=None,
                    address=addr,
                    total_score=total_score,
                    base_score=base_score,
                    security_score=security_score
                )

            badges = derive_badges_from_score(addr, score_for_badges)

            dashboard_data = {
                "lastScores": {
                    "total_score": total_score,
                    "base_score": base_score,
                    "security_score": security_score,
                    "date": datetime.fromtimestamp(onchain["timestamp"]).isoformat(),
                    "source": "onchain"
                },
                "scoreHistory": get_recent_history(addr),
                "badges": badges,
            }

            save_user_dashboard(addr, dashboard_data)
            return JSONResponse(content=dashboard_data)

        # No on-chain data exists - return empty state
        return JSONResponse(content={
            "lastScores": {
                "total_score": 0.0,
                "base_score": 0.0,
                "security_score": 0.0,
                "date": datetime.now().isoformat(),
                "source": "none"
            },
            "scoreHistory": get_recent_history(addr),
            "badges": []
        })

    except Exception as e:
        print(f"Error in dashboard_summary: {e}")
        return JSONResponse(status_code=200, content={
            "lastScores": {
                "total_score": 0.0,
                "base_score": 0.0,
                "security_score": 0.0,
                "date": datetime.now().isoformat(),
                "source": "error"
            },
            "scoreHistory": [],
            "badges": []
        })


@router.get("/score/contract_info")
def score_contract_info(address: str | None = Query(default=None, description="Optional user address to read nonce")):
    try:
        if not settings.score_checker_address:
            raise HTTPException(status_code=500, detail="ScoreChecker address not configured")
            
        # Create web3 provider with retry mechanism and timeout
        from requests.adapters import HTTPAdapter
        from urllib3.util import Retry
        import requests
        
        session = requests.Session()
        # Configure retry strategy with backoff
        retry_strategy = Retry(
            total=3,
            backoff_factor=0.5,
            status_forcelist=[429, 500, 502, 503, 504],
            allowed_methods=["HEAD", "GET", "POST"]
        )
        adapter = HTTPAdapter(max_retries=retry_strategy)
        session.mount("http://", adapter)
        session.mount("https://", adapter)
        
        # Create provider with custom session and longer timeout
        provider = Web3.HTTPProvider(
            settings.base_rpc_url,
            request_kwargs={'timeout': 10},
            session=session
        )
        w3 = Web3(provider)
        
        sc_addr_raw = settings.score_checker_address or _SCORECHECKER_ADDR_FROM_JSON or ""
        sc_addr = Web3.to_checksum_address(sc_addr_raw)
        # Check code exists
        code = w3.eth.get_code(sc_addr)
        if not code or len(code) == 0:
            raise HTTPException(status_code=400, detail=f"No contract code at {sc_addr} on RPC {settings.base_rpc_url}")
        minimal_abi = [
            {"inputs": [], "name": "authorizedSigner", "outputs": [{"type": "address"}], "stateMutability": "view", "type": "function"},
            {"inputs": [], "name": "checkFee", "outputs": [{"type": "uint256"}], "stateMutability": "view", "type": "function"},
            {"inputs": [], "name": "minInterval", "outputs": [{"type": "uint256"}], "stateMutability": "view", "type": "function"},
            {"inputs": [], "name": "maxSigAge", "outputs": [{"type": "uint256"}], "stateMutability": "view", "type": "function"},
            {"inputs": [{"name": "user", "type": "address"}], "name": "nonces", "outputs": [{"type": "uint256"}], "stateMutability": "view", "type": "function"},
        ]
        c = w3.eth.contract(address=sc_addr, abi=minimal_abi)
        
        # Use try/except for each call to handle potential errors
        try:
            signer_onchain = c.functions.authorizedSigner().call()
        except Exception as e:
            print(f"Error getting authorizedSigner: {e}")
            signer_onchain = "0x0000000000000000000000000000000000000000"
            
        try:
            fee = int(c.functions.checkFee().call())
        except Exception as e:
            print(f"Error getting checkFee: {e}")
            fee = 0
            
        try:
            interval = int(c.functions.minInterval().call())
        except Exception as e:
            print(f"Error getting minInterval: {e}")
            interval = 0
            
        try:
            max_age = int(c.functions.maxSigAge().call())
        except Exception as e:
            print(f"Error getting maxSigAge: {e}")
            max_age = 0
            
        nonce_value = None
        if address:
            try:
                user = Web3.to_checksum_address(address)
                nonce_value = int(c.functions.nonces(user).call())
            except Exception as e:
                print(f"Error getting nonce for {address}: {e}")
                nonce_value = 0
        return JSONResponse(content={
            "rpc": settings.base_rpc_url,
            "chainId": settings.chain_id,
            "contract": sc_addr,
            "authorizedSigner_onchain": signer_onchain,
            "checkFee": fee,
            "minInterval": interval,
            "maxSigAge": max_age,
            "nonce": nonce_value,
        })
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/badges")
def get_badges(
    address: str = Query(...),
    current: str | None = Depends(get_optional_address),
):
    """
    Get badges based on on-chain score data.
    Secured: requires Authorization and enforces address = token.sub (when ENFORCE_AUTH=true)
    """
    # --- Auth & address enforcement ---
    if settings.enforce_auth:
        if current is None:
            raise HTTPException(status_code=401, detail="Missing token")
        addr = _validate_eth_address(address)
        if address.lower() != current.lower():
            raise HTTPException(status_code=403, detail="Forbidden: address mismatch")
    else:
        if address:
            addr = _validate_eth_address(address)
        elif current:
            addr = _validate_eth_address(current)
        else:
            raise HTTPException(status_code=400, detail="Address required")

    try:
        onchain = _read_onchain_last_score(addr)
        onchain_card = _read_onchain_score_card(addr)

        if onchain and onchain.get("timestamp", 0) > 0:
            if onchain_card:
                from backend.models.score import ScoreResponse, ScoreBreakdown, SecurityBreakdown
                score_for_badges = ScoreResponse(
                    basename=None,
                    address=addr,
                    total_score=float(onchain_card["totalScore"]),
                    base_score=float(onchain_card["baseScore"]),
                    security_score=float(onchain_card["securityScore"]),
                    base=ScoreBreakdown(
                        tx_count=onchain_card["numberOfTransactions"],
                        gas_used=float(onchain_card["gasPaid"]),
                        current_balance=float(onchain_card["currentBalance"]) / 1e18,
                        past_balance=float(onchain_card["avgBalanceLastMonth"]) / 1e18,
                        current_streak=onchain_card["currentStreak"],
                        max_streak=onchain_card["maxStreak"],
                        age_days=0,
                        base_score=float(onchain_card["baseScore"])
                    ),
                    security=SecurityBreakdown(
                        risky_tokens=onchain_card["suspiciousTokens"],
                        risky_contracts=onchain_card["suspiciousContracts"],
                        risky_signs=onchain_card["dangerousInteractions"],
                        suspicious_nfts=onchain_card["suspiciousNfts"],
                        security_score=float(onchain_card["securityScore"])
                    )
                )
            else:
                from backend.models.score import ScoreResponse
                score_for_badges = ScoreResponse(
                    basename=None,
                    address=addr,
                    total_score=float(onchain["score"]),
                    base_score=0.0,
                    security_score=0.0
                )

            badges = derive_badges_from_score(addr, score_for_badges)
            return JSONResponse(content={"address": addr, "badges": badges})

        return JSONResponse(content={"address": addr, "badges": []})

    except Exception as e:
        print(f"Error in get_badges: {e}")
        return JSONResponse(content={"address": addr if 'addr' in locals() else address, "badges": []})



# Simple in-memory profile storage for now; can be replaced with DB later
_PROFILES: dict[str, dict] = {}

def get_profiles_file():
    base_dir = Path(__file__).parent.parent.parent
    return base_dir / "data" / "profiles.json"

def load_profiles() -> dict:
    path = get_profiles_file()
    if path.exists():
        try:
            with open(path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                if isinstance(data, dict):
                    return data
        except Exception:
            return {}
    return {}

def save_profiles(data: dict) -> None:
    path = get_profiles_file()
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)

# initialize profiles from disk
_PROFILES = load_profiles()


@router.get("/profile")
def get_profile(address: str = Query(...), current: str | None = Depends(get_optional_address)):
    if settings.enforce_auth:
        if current is None:
            raise HTTPException(status_code=401, detail="Missing token")
        if address.lower() != current.lower():
            raise HTTPException(status_code=403, detail="Forbidden: address mismatch")
    profile = _PROFILES.get(address.lower())
    if not profile:
        profile = UserProfile(address=address).model_dump()
        _PROFILES[address.lower()] = profile
        save_profiles(_PROFILES)
    return JSONResponse(content=profile)


@router.post("/profile")
def save_profile(profile: UserProfile, current: str | None = Depends(get_optional_address)):
    if settings.enforce_auth:
        if current is None:
            raise HTTPException(status_code=401, detail="Missing token")
        if profile.address.lower() != current.lower():
            raise HTTPException(status_code=403, detail="Forbidden: address mismatch")
    # Preserve user-set username/avatar even when useBasenameProfile is toggled on
    # Store resolved basename separately (basename, basenameAvatar) for display-only
    existing = _PROFILES.get(profile.address.lower(), {})
    data = profile.model_dump()
    if profile.useBasenameProfile:
        # If payload includes basename/basenameAvatar, keep them in separate fields
        basename = data.get("basename") or existing.get("basename")
        basename_avatar = data.get("basenameAvatar") or existing.get("basenameAvatar")
        # Do not overwrite user's manual username/avatar
        data["username"] = existing.get("username", data.get("username", ""))
        data["avatar"] = existing.get("avatar", data.get("avatar", "/default-avatar.svg"))
        data["basename"] = basename
        data["basenameAvatar"] = basename_avatar
    else:
        # When turning off basename mode, keep stored user username/avatar
        data["basename"] = None
        data["basenameAvatar"] = None

    _PROFILES[profile.address.lower()] = data
    save_profiles(_PROFILES)
    return JSONResponse(content={"status": "saved"})


@router.get("/resolve")
def resolve_endpoint(input: str = Query(..., description="Wallet address or Basename")):
    try:
        result = resolve_input_basename_address(input)
        return JSONResponse(content=result)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/profile/sync_basename")
def sync_basename(address: str = Query(...), current: str | None = Depends(get_optional_address)):
    """
    Resolve Basename and return suggested username/avatar to sync
    (avatar placeholder for now; extend to fetch avatar when available).
    """
    if settings.enforce_auth:
        if current is None:
            raise HTTPException(status_code=401, detail="Missing token")
        if address.lower() != current.lower():
            raise HTTPException(status_code=403, detail="Forbidden: address mismatch")
    try:
        basename = resolve_address_to_basename(address)
        if not basename:
            return JSONResponse(content={"has_basename": False})
        # Try resolve avatar text record
        avatar = resolve_basename_avatar(basename) or None
        return JSONResponse(content={
            "has_basename": True,
            "basename": basename,
            "basenameAvatar": avatar
        })
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/score/sign")
def sign_score(
    address: str = Query(..., description="User address"),
    score: float = Query(..., description="Total score (float allowed; will be rounded to int 0-1e6)"),
    admin: str = Depends(require_admin),  # ← just admin
):
    # Rate limiting for admin endpoints
    if not hasattr(sign_score, '_last_call'):
        sign_score._last_call = 0
    import time
    current_time = time.time()
    if current_time - sign_score._last_call < 2:  # 2 seconds between calls
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
    sign_score._last_call = current_time
    
    # Input validation
    if not isinstance(score, (int, float)) or score < 0 or score > 1000000:
        raise HTTPException(status_code=400, detail="Score must be between 0 and 1,000,000")
    
    addr = _validate_eth_address(address)
    
    try:
        # Use V2 contract address
        contract_addr = _SCORECHECKER_V2_ADDR or settings.score_checker_v2_address
        if not contract_addr:
            raise HTTPException(status_code=500, detail="ScoreChecker V2 address not configured")
        if not settings.authorized_signer_private_key:
            raise HTTPException(status_code=500, detail="Signer not configured")

        w3 = Web3(Web3.HTTPProvider(settings.base_rpc_url))
        sc_addr = Web3.to_checksum_address(contract_addr)
        user = Web3.to_checksum_address(address)

        # Best-effort check for contract code (don't hard-fail)
        try:
            code = w3.eth.get_code(sc_addr)
            if not code or len(code) == 0:
                # continue; we'll still try to read nonce and sign
                print(f"Warning: No contract code found at {sc_addr}, but continuing with signing")
        except Exception as e:
            print(f"Error checking contract code: {e}, but continuing with signing")

        # read current nonce using a minimal ABI for robustness
        signer_onchain = None
        nonce = 0
        try:
            abi_to_use = _SCORECHECKER_V2_ABI or [
                {"inputs": [{"name": "user", "type": "address"}], "name": "nonces", "outputs": [{"name": "", "type": "uint256"}], "stateMutability": "view", "type": "function"},
                {"inputs": [], "name": "authorizedSigner", "outputs": [{"name": "", "type": "address"}], "stateMutability": "view", "type": "function"},
            ]
            contract = w3.eth.contract(address=sc_addr, abi=abi_to_use)
            nonce = int(contract.functions.nonces(user).call())
            try:
                signer_onchain = Web3.to_checksum_address(contract.functions.authorizedSigner().call())
            except Exception as e:
                print(f"Error getting authorizedSigner: {e}")
                signer_onchain = None
        except Exception:
            # fallback raw eth_call for nonce
            try:
                selector = Web3.keccak(text="nonces(address)")[:4].hex()
                selector = selector[2:] if selector.startswith('0x') else selector
                data = '0x' + selector + user[2:].rjust(64, '0')
                raw = w3.eth.call({"to": sc_addr, "data": data})
                nonce = int.from_bytes(raw, byteorder='big')
            except Exception:
                # last resort: nonce 0 (may cause InvalidNonce on-chain)
                nonce = 0

        issued_at = int(w3.eth.get_block('latest').timestamp)

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
        # normalize score to integer in [0, 1_000_000]
        score_int = int(round(float(score)))
        if score_int < 0:
            score_int = 0
        if score_int > 1_000_000:
            score_int = 1_000_000

        value = {
            "user": user,
            "score": score_int,
            "issuedAt": issued_at,
            "nonce": nonce,
        }

        msg = encode_typed_data(full_message={"types": {"EIP712Domain": [
            {"name": "name", "type": "string"},
            {"name": "version", "type": "string"},
            {"name": "chainId", "type": "uint256"},
            {"name": "verifyingContract", "type": "address"},
        ], **types}, "domain": domain, "primaryType": "Score", "message": value})

        acct = Account.from_key(settings.authorized_signer_private_key)
        sig = acct.sign_message(msg)
        signature = sig.signature.hex()
        if not signature.startswith('0x'):
            signature = '0x' + signature

        return JSONResponse(content={
            "score": score_int,
            "issuedAt": issued_at,
            "nonce": nonce,
            "signature": signature,
        })
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/score/sign_card")
def sign_score_card(
    address: str = Query(..., description="User address"),
    total_score: float = Query(..., description="Total score"),
    base_score: float = Query(..., description="Base score"),
    security_score: float = Query(..., description="Security score"),
    tx_count: int = Query(..., description="Number of transactions"),
    current_streak: int = Query(..., description="Current streak"),
    max_streak: int = Query(..., description="Max streak"),
    current_balance: float = Query(..., description="Current balance in ETH"),
    avg_balance_last_month: float = Query(..., description="Average balance last month in ETH"),
    gas_paid: float = Query(..., description="Gas paid in ETH"),
    suspicious_tokens: int = Query(..., description="Number of suspicious tokens"),
    suspicious_contracts: int = Query(..., description="Number of suspicious contracts"),
    dangerous_interactions: int = Query(..., description="Number of dangerous interactions"),
    suspicious_nfts: int = Query(..., description="Number of suspicious NFTs"),
    admin: str = Depends(require_admin),  # ← just admin
):
    # Rate limiting for admin endpoints
    if not hasattr(sign_score_card, '_last_call'):
        sign_score_card._last_call = 0
    import time
    current_time = time.time()
    if current_time - sign_score_card._last_call < 2:  # 2 seconds between calls
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
    sign_score_card._last_call = current_time
    
    # Input validation
    addr = _validate_eth_address(address)
    if not isinstance(total_score, (int, float)) or total_score < 0 or total_score > 1000000:
        raise HTTPException(status_code=400, detail="Total score must be between 0 and 1,000,000")
    if not isinstance(base_score, (int, float)) or base_score < 0 or base_score > 1000000:
        raise HTTPException(status_code=400, detail="Base score must be between 0 and 1,000,000")
    if not isinstance(security_score, (int, float)) or security_score < 0 or security_score > 1000000:
        raise HTTPException(status_code=400, detail="Security score must be between 0 and 1,000,000")
    if not isinstance(tx_count, int) or tx_count < 0:
        raise HTTPException(status_code=400, detail="Transaction count must be non-negative integer")
    if not isinstance(current_streak, int) or current_streak < 0:
        raise HTTPException(status_code=400, detail="Current streak must be non-negative integer")
    if not isinstance(max_streak, int) or max_streak < 0:
        raise HTTPException(status_code=400, detail="Max streak must be non-negative integer")
    if not isinstance(current_balance, (int, float)) or current_balance < 0:
        raise HTTPException(status_code=400, detail="Current balance must be non-negative")
    if not isinstance(avg_balance_last_month, (int, float)) or avg_balance_last_month < 0:
        raise HTTPException(status_code=400, detail="Average balance must be non-negative")
    if not isinstance(gas_paid, (int, float)) or gas_paid < 0:
        raise HTTPException(status_code=400, detail="Gas paid must be non-negative")
    if not isinstance(suspicious_tokens, int) or suspicious_tokens < 0:
        raise HTTPException(status_code=400, detail="Suspicious tokens count must be non-negative integer")
    if not isinstance(suspicious_contracts, int) or suspicious_contracts < 0:
        raise HTTPException(status_code=400, detail="Suspicious contracts count must be non-negative integer")
    if not isinstance(dangerous_interactions, int) or dangerous_interactions < 0:
        raise HTTPException(status_code=400, detail="Dangerous interactions count must be non-negative integer")
    if not isinstance(suspicious_nfts, int) or suspicious_nfts < 0:
        raise HTTPException(status_code=400, detail="Suspicious NFTs count must be non-negative integer")
    
    try:
        # Use V2 contract address
        contract_addr = _SCORECHECKER_V2_ADDR or settings.score_checker_v2_address
        if not contract_addr:
            raise HTTPException(status_code=500, detail="ScoreChecker V2 address not configured")
        if not settings.authorized_signer_private_key:
            raise HTTPException(status_code=500, detail="Signer not configured")

        w3 = Web3(Web3.HTTPProvider(settings.base_rpc_url))
        sc_addr = Web3.to_checksum_address(contract_addr)
        user = Web3.to_checksum_address(address)

        # Read current nonce
        nonce = 0
        try:
            abi_to_use = _SCORECHECKER_V2_ABI or [
                {"inputs": [{"name": "user", "type": "address"}], "name": "nonces", "outputs": [{"name": "", "type": "uint256"}], "stateMutability": "view", "type": "function"},
            ]
            contract = w3.eth.contract(address=sc_addr, abi=abi_to_use)
            nonce = int(contract.functions.nonces(user).call())
        except Exception:
            nonce = 0

        issued_at = int(w3.eth.get_block('latest').timestamp)

        # Convert values to proper units
        # Scores are normalized to 0-1000000 (6 decimals)
        total_score_int = int(round(float(total_score)))
        base_score_int = int(round(float(base_score)))
        security_score_int = int(round(float(security_score)))
        
        # Balances are in wei (ETH * 10^18)
        current_balance_wei = int(current_balance * 1e18)
        avg_balance_wei = int(avg_balance_last_month * 1e18)
        gas_paid_wei = int(gas_paid * 1e18)

        domain = {
            "name": "BaseBadgeScore",
            "version": "1",
            "chainId": settings.chain_id,
            "verifyingContract": sc_addr,
        }
        types = {
            "ScoreCard": [
                {"name": "user", "type": "address"},
                {"name": "totalScore", "type": "uint256"},
                {"name": "baseScore", "type": "uint256"},
                {"name": "securityScore", "type": "uint256"},
                {"name": "numberOfTransactions", "type": "uint256"},
                {"name": "currentStreak", "type": "uint256"},
                {"name": "maxStreak", "type": "uint256"},
                {"name": "currentBalance", "type": "uint256"},
                {"name": "avgBalanceLastMonth", "type": "uint256"},
                {"name": "gasPaid", "type": "uint256"},
                {"name": "suspiciousTokens", "type": "uint256"},
                {"name": "suspiciousContracts", "type": "uint256"},
                {"name": "dangerousInteractions", "type": "uint256"},
                {"name": "suspiciousOilCompanies", "type": "uint256"},
                {"name": "issuedAt", "type": "uint256"},
                {"name": "nonce", "type": "uint256"},
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

        msg = encode_typed_data(full_message={"types": {"EIP712Domain": [
            {"name": "name", "type": "string"},
            {"name": "version", "type": "string"},
            {"name": "chainId", "type": "uint256"},
            {"name": "verifyingContract", "type": "address"},
        ], **types}, "domain": domain, "primaryType": "ScoreCard", "message": value})

        acct = Account.from_key(settings.authorized_signer_private_key)
        sig = acct.sign_message(msg)
        signature = sig.signature.hex()
        if not signature.startswith('0x'):
            signature = '0x' + signature

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
            "signature": signature,
        })
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/csv/list/{address}")
def list_csv_reports(address: str, current: str | None = Depends(get_optional_address)):
    """
    List available CSV security reports for a specific address
    """
    # --- Auth & address enforcement ---
    if settings.enforce_auth:
        if current is None: raise HTTPException(status_code=401, detail="Missing token")
        if address.lower() != current.lower(): raise HTTPException(status_code=403, detail="Forbidden: address mismatch")

    try:
        # Validate address format
        addr = _validate_eth_address(address)
        
        # Get the security reports directory
        base_dir = Path(__file__).parent.parent.parent
        reports_dir = base_dir / "data" / "security_reports"
        
        if not reports_dir.exists():
            return JSONResponse(content={"reports": []})
        
        # Find all CSV files for this address
        pattern = f"*_{addr}_*.csv"
        csv_files = list(reports_dir.glob(pattern))
        
        reports = []
        for file_path in csv_files:
            # Parse filename: type_address_timestamp.csv
            parts = file_path.stem.split('_')
            if len(parts) >= 5:
                report_type = f"{parts[0]}_{parts[1]}"            # risky_tokens / risky_contracts / risky_signs / suspicious_nfts
                addr_in_file = parts[2]                            # 0x...
                timestamp = f"{parts[3]}_{parts[4]}"              # YYYYMMDD_HHMMSS
            else:
                continue
                
            reports.append({
                "type": report_type,
                "timestamp": timestamp,
                "filename": file_path.name,
                "size": file_path.stat().st_size,
                "download_url": f"/csv/{report_type}/{addr_in_file}?timestamp={timestamp}",
            })
        
        # Sort by timestamp (newest first)
        reports.sort(key=lambda x: x["timestamp"], reverse=True)
        
        return JSONResponse(content={"reports": reports})
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list CSV reports: {str(e)}")


@router.get("/csv/{report_type}/{address}")
def download_csv_report(
    report_type: str,
    address: str,
    timestamp: str = Query(None, description="Optional timestamp filter for specific report"),
    current: str | None = Depends(get_optional_address),
):
    """
    Download CSV security report files for a specific address and report type.
    Report types: risky_tokens, risky_contracts, risky_signs, suspicious_nfts
    """
    
    # --- Auth & address enforcement ---
    if settings.enforce_auth:
        if current is None: raise HTTPException(status_code=401, detail="Missing token")
        if address.lower() != current.lower(): raise HTTPException(status_code=403, detail="Forbidden: address mismatch")

    try:
        # Validate report type
        valid_types = ['risky_tokens', 'risky_contracts', 'risky_signs', 'suspicious_nfts']
        if report_type not in valid_types:
            raise HTTPException(status_code=400, detail=f"Invalid report type. Must be one of: {', '.join(valid_types)}")
        
        # Validate address format
        addr = _validate_eth_address(address)
        
        # Get the security reports directory
        base_dir = Path(__file__).parent.parent.parent
        reports_dir = base_dir / "data" / "security_reports"
        
        if not reports_dir.exists():
            raise HTTPException(status_code=404, detail="Security reports directory not found")
        
        # Find the most recent CSV file for this address and report type
        pattern = f"{report_type}_{addr}_*.csv"
        csv_files = list(reports_dir.glob(pattern))
        
        if not csv_files:
            raise HTTPException(status_code=404, detail=f"No {report_type} reports found for address {address}")
        
        # If timestamp is provided, try to find exact match
        if timestamp:
            target_file = reports_dir / f"{report_type}_{addr}_{timestamp}.csv"
            if not target_file.exists():
                raise HTTPException(status_code=404, detail=f"Report not found for timestamp {timestamp}")
        else:
            # Get the most recent file (by filename sorting)
            csv_files.sort(reverse=True)
            target_file = csv_files[0]
        
        # Read the CSV file
        if not target_file.exists():
            raise HTTPException(status_code=404, detail="Report file not found")
        
        # Return the CSV file as a download
        from fastapi.responses import FileResponse
        ts = '_'.join(target_file.stem.split('_')[3:])   # YYYYMMDD_HHMMSS
        filename = f"{report_type}_{address}_{ts}.csv"
        return FileResponse(
            path=str(target_file),
            filename=filename,
            media_type='text/csv',
            headers={'Content-Disposition': f'attachment; filename="{filename}"'}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to download CSV report: {str(e)}")
