# backend/utils/wallet.py

import requests
import base64
from datetime import datetime, timedelta, timezone
from typing import Optional
from web3 import Web3
from eth_utils import keccak
import time
import json
import csv
import os
import re
import asyncio
import aiohttp
from pathlib import Path
from functools import lru_cache


# ---------------- API CONFIGURATION ----------------
# Alchemy API
ALCHEMY_API_KEY = os.getenv("ALCHEMY_API_KEY", "")
ALCHEMY_BASE = f"https://base-mainnet.g.alchemy.com/v2/{ALCHEMY_API_KEY}"

# Etherscan API
ETHERSCAN_API_KEY = os.getenv("ETHERSCAN_API_KEY", "")
ETHERSCAN_BASE = "https://api.etherscan.io/api"
CHAIN_ID = 8453

# Zerion API
ZERION_BASE = "https://api.zerion.io/v1"
ZERION_API_KEY = os.getenv("ZERION_API_KEY", "")

# Create session for connection pooling
session = requests.Session()
session.headers.update({
    'User-Agent': 'BaseBadge/1.0',
    'Accept': 'application/json'
})
adapter = requests.adapters.HTTPAdapter(max_retries=requests.adapters.Retry(
    total=3,
    backoff_factor=0.5,
    status_forcelist=[429, 500, 502, 503, 504],
))
session.mount('http://', adapter)
session.mount('https://', adapter)

ZERION_API_KEY_WITH_COLON = ZERION_API_KEY + ":"
ENCODED_KEY = base64.b64encode((ZERION_API_KEY_WITH_COLON).encode()).decode() if ZERION_API_KEY else ""
Z_HEADERS = {
    "accept": "application/json",
    "authorization": f"Basic {ENCODED_KEY}"
}

# ---------------- Web3 Setup (configurable + headers) ----------------
# Use an API-keyed provider if available (recommended for production). Fallback to public only in dev.
BASE_MAINNET_RPC = os.getenv("BASE_MAINNET_RPC_URL", "https://mainnet.base.org")
w3 = Web3(
    Web3.HTTPProvider(
        BASE_MAINNET_RPC,
        request_kwargs={
            "headers": {
                "User-Agent": "BaseBadge/1.0 (+https://basebadge.app)",
                "Accept": "application/json",
            },
            # Note: web3 uses requests internally; retries handled below at call-site
            "timeout": 15,
        },
    )
)

# Basename/ENS Resolver Setup
L2RESOLVER_ADDRESS = Web3.to_checksum_address("0xC6d566A56A1aFf6508b41f6c90ff131615583BCD")
REVERSEREGISTRAR_ADDRESS = Web3.to_checksum_address("0x79ea96012eea67a83431f1701b3dff7e37f9e282")
L2RESOLVER_ABI_PATH = os.path.join(os.path.dirname(__file__), "../contracts/L2Resolver.json")
REVERSEREGISTRAR_ABI_PATH = os.path.join(os.path.dirname(__file__), "../contracts/ReverseRegistrar.json")

# Load ABI files
with open(L2RESOLVER_ABI_PATH, "r") as f:
    l2resolver_abi = json.load(f)["abi"]
with open(REVERSEREGISTRAR_ABI_PATH, "r") as f:
    reverse_abi = json.load(f)["abi"]

# Create contract instances
l2resolver = w3.eth.contract(address=L2RESOLVER_ADDRESS, abi=l2resolver_abi)
reverse_registrar = w3.eth.contract(address=REVERSEREGISTRAR_ADDRESS, abi=reverse_abi)

# ---------------- Simple in-process caches (TTL) ----------------
_ADDRESS_NAME_CACHE: dict[str, tuple[Optional[str], float]] = {}
_NAME_ADDRESS_CACHE: dict[str, tuple[Optional[str], float]] = {}
_AVATAR_CACHE: dict[str, tuple[Optional[str], float]] = {}
_CACHE_TTL_SECONDS = int(os.getenv("BASENAME_CACHE_TTL", "1800"))  # default 30 min

def _cache_get(cache: dict, key: str) -> Optional[str]:
    try:
        value, ts = cache.get(key, (None, 0.0))
        if value is None:
            return None
        if time.time() - ts < _CACHE_TTL_SECONDS:
            return value
        # expired
        cache.pop(key, None)
        return None
    except Exception:
        return None

def _cache_set(cache: dict, key: str, value: Optional[str]) -> None:
    try:
        cache[key] = (value, time.time())
    except Exception as e:
        print(f"Error setting cache value for key {key}: {e}")

def _call_with_retry(fn, *args, **kwargs):
    """Exponential backoff on transient errors (incl. 429)."""
    delays = [0.3, 0.8, 1.6]
    last_err = None
    for attempt, delay in enumerate(delays, 1):
        try:
            return fn(*args, **kwargs)
        except Exception as e:  # broad: web3 may raise various wrappers
            msg = str(e)
            last_err = e
            if "429" in msg or "Too Many Requests" in msg or "rate" in msg.lower():
                time.sleep(delay)
                continue
            # occasional timeouts/connection resets
            if any(s in msg for s in ["Timeout", "timeout", "timed out", "EOF", "Connection reset"]):
                time.sleep(delay)
                continue
            break
    # final attempt without sleep
    try:
        return fn(*args, **kwargs)
    except Exception as e:
        raise e if last_err is None else last_err

# ============================================================================
# BASENAME/ENS FUNCTIONS
# ============================================================================

def namehash(name: str) -> str:
    """Convert ENS name to namehash"""
    node = b'\x00' * 32
    if name:
        labels = name.split('.')
        for label in reversed(labels):
            labelhash = keccak(text=label)
            node = keccak(node + labelhash)
    return "0x" + node.hex()



# ---------------- get all transactions----------------
def get_all_transactions(address: str) -> list:
    """
    Returns a list of all transactions for the given address on Base network using Blockscout API.
    Each transaction is a dict and must have 'timeStamp' key.
    """
    BLOCKSCOUT_BASE = "https://base.blockscout.com/api"
    txs = []
    page = 1
    offset = 10000
    while True:
        params = {
            "module": "account",
            "action": "txlist",
            "address": address,
            "startblock": 0,
            "endblock": 99999999,
            "page": page,
            "offset": offset,
            "sort": "asc"
        }
        try:
            res = session.get(BLOCKSCOUT_BASE, params=params, timeout=10)
            res.raise_for_status()
            data = res.json()
            if data.get('status') != "1":
                break
            page_txs = data.get('result', [])
            if not page_txs:
                break
            txs.extend(page_txs)
            if len(page_txs) < offset:
                break
            page += 1
        except Exception as e:
            print(f"[ERROR] Blockscout tx fetch failed: {e}")
            break
    return txs

# ---------------- Get total transaction count ----------------
def get_total_tx_count(address: str) -> int:
    return len(get_all_transactions(address))

# ---------------- Get total gas used ----------------
def get_total_gas_used(address: str) -> int:
    """
    Returns the total gas paid (gasUsed * gasPrice) for all transactions of the given address on Base network using Blockscout API.
    """
    txs = get_all_transactions(address)
    total_gas_paid = 0
    for tx in txs:
        try:
            # Only transactions that are from this address
            if tx.get('from', '').lower() == address.lower():
                gas_used = int(tx.get('gasUsed', '0'))
                #gas_price = int(tx.get('gasPrice', '0'))
                total_gas_paid += gas_used # * gas_price
        except Exception:
            continue
    return total_gas_paid

# ---------------- Get current balance ----------------
def get_current_balance(address: str) -> dict:
    """Get current wallet balance"""
    url = f"{ZERION_BASE}/wallets/{address}/portfolio"
    try:
        res = session.get(url, headers=Z_HEADERS, timeout=10)
        res.raise_for_status()
        data = res.json()
        base_value = data['data']['attributes']['positions_distribution_by_chain']['base']
        return {"base_usd": base_value}
    except Exception as e:
        print(f"[Zerion Portfolio Error] {e}")
        return {"base_usd": 0.0}

# ---------------- Get past balance ----------------
def get_past_balance(address: str) -> dict:
    """
    Returns the average Base network balance in USD for the past month using Zerion API.
    """
    url = f"{ZERION_BASE}/wallets/{address}/charts/month"
    params = {
        "currency": "usd",
        "filter[chain_ids]": "base"
    }
    try:
        res = session.get(url, headers=Z_HEADERS, params=params, timeout=10)
        res.raise_for_status()
        data = res.json()
        points = data["data"]["attributes"]["points"]
        values = [v for (_, v) in points if v]
        if not values:
            return {"base_usd": 0.0}
        avg_balance = sum(values) / len(values)
        return {"base_usd": avg_balance}
    except Exception as e:
        print(f"[Zerion Past Balance Error] {e}")
        return {"base_usd": 0.0}

# ---------------- Get wallet streaks ----------------
def get_wallet_streaks(address: str, tz: timezone = timezone.utc) -> dict:
    """Get wallet activity streaks"""
    txs = get_all_transactions(address)
    if not txs:
        return {"current_streak": 0, "max_streak": 0}
    days = set()
    for tx in txs:
        try:
            dt = datetime.fromtimestamp(int(tx['timeStamp']), tz)
            days.add(dt.date())
        except Exception:
            continue
    if not days:
        return {"current_streak": 0, "max_streak": 0}
    days = sorted(days)
    max_streak = 1
    streak = 1
    for i in range(1, len(days)):
        if (days[i] - days[i-1]).days == 1:
            streak += 1
        else:
            streak = 1
        if streak > max_streak:
            max_streak = streak
    today = datetime.now(tz).date()
    streak = 0
    while (today - timedelta(days=streak)) in days:
        streak += 1
    current_streak = streak
    return {"current_streak": current_streak, "max_streak": max_streak}

# ---------------- Get wallet age ----------------
def get_wallet_age(address: str, tz: timezone = timezone.utc) -> int:
    """
    Returns the wallet age in days (difference between first transaction and today, in the given timezone).
    """
    txs = get_all_transactions(address)
    if txs:
        first_tx_time = min(int(tx['timeStamp']) for tx in txs)
        first_tx_date = datetime.fromtimestamp(first_tx_time, tz).date()
        today = datetime.now(tz).date()
        return (today - first_tx_date).days
    return 0

# ---------------- Resolve basename to address ----------------
def resolve_basename_to_address(basename: str) -> str:
    # cache first
    cached = _cache_get(_NAME_ADDRESS_CACHE, basename.lower())
    if cached is not None:
        return cached

    node = namehash(basename)
    try:
        address = _call_with_retry(l2resolver.functions.addr(node).call)
    except Exception as e:
        print(f"Error resolving addr for {basename}: {e}")
        return None
    if isinstance(address, str) and int(address, 16) != 0:
        checksummed = Web3.to_checksum_address(address)
        _cache_set(_NAME_ADDRESS_CACHE, basename.lower(), checksummed)
        return checksummed
    _cache_set(_NAME_ADDRESS_CACHE, basename.lower(), None)
    return None

# ---------------- Resolve address to basename ----------------
def resolve_address_to_basename(address: str) -> str:
    key = address.lower()
    cached = _cache_get(_ADDRESS_NAME_CACHE, key)
    if cached is not None:
        return cached
    try:
        node = _call_with_retry(reverse_registrar.functions.node(address).call)
        name = _call_with_retry(l2resolver.functions.name(node).call)
        result = name if name else None
        _cache_set(_ADDRESS_NAME_CACHE, key, result)
        return result
    except Exception as e:
        print(f"Error resolving reverse for {address}: {e}")
        return None

# ---------------- Resolve basename avatar text record ----------------
def resolve_basename_avatar(basename: str) -> Optional[str]:
    """Return the avatar text record for a Basename if set, else None."""
    cache_key = basename.lower()
    cached = _cache_get(_AVATAR_CACHE, cache_key)
    if cached is not None:
        return cached
    try:
        node = namehash(basename)
        avatar = _call_with_retry(l2resolver.functions.text(node, "avatar").call)
        value = avatar if isinstance(avatar, str) and avatar.strip() else None
        _cache_set(_AVATAR_CACHE, cache_key, value)
        return value
    except Exception as e:
        _cache_set(_AVATAR_CACHE, cache_key, None)
        return None

# ---------------- Resolve input basename and address ----------------
def resolve_input_basename_address(user_input: str) -> dict:
    """Detects input type and resolves to both Basename and Address (if possible)."""
    if user_input.endswith(".base.eth"):
        address = resolve_basename_to_address(user_input)
        return {
            "Basename": user_input,
            "Address": address
        }
    elif user_input.startswith("0x") and len(user_input) == 42:
        basename = resolve_address_to_basename(user_input)
        return {
            "Basename": basename if basename else "No reverse Basename set for this address",
            "Address": user_input
        }
    else:
        return {
            "Basename": None,
            "Address": None
        }

# ---------------- Get wallet data ----------------
def get_wallet_data(identifier: str) -> dict:
    """Get comprehensive wallet data"""
    try:
        resolved = resolve_input_basename_address(identifier)
        basename = resolved.get("Basename")
        address = resolved.get("Address")
        if not address or address in (None, "", "0x0000000000000000000000000000000000000000"):
            return {
                "Basename": basename,
                "Address": address,
                "tx_count": 0,
                "wallet_age_days": 0,
                "current_balance": 0.0,
                "past_balance": 0.0,
                "total_gas_used": 0,
                "current_streak": 0,
                "max_streak": 0,
                "error": "Could not resolve a valid address from input."
            }
        age_days = get_wallet_age(address)
        txs = get_all_transactions(address)
        tx_count = len(txs)
        total_gas_used = get_total_gas_used(address)
        current_balance = get_current_balance(address)
        past_balance = get_past_balance(address)
        streaks = get_wallet_streaks(address)

        return {
            "Basename": basename,
            "Address": address,
            "tx_count": tx_count,
            "wallet_age_days": age_days,
            "current_balance": round(current_balance['base_usd'], 4),
            "past_balance": round(past_balance['base_usd'], 2),
            "total_gas_used": total_gas_used,
            "current_streak": streaks["current_streak"],
            "max_streak": streaks["max_streak"],
        }
    except Exception as e:
        print(f"[ERROR] wallet data fetch failed: {e}")
        return {
            "Basename": None,
            "Address": None,
            "tx_count": 0,
            "wallet_age_days": 0,
            "current_balance": 0.0,
            "past_balance": 0.0,
            "total_gas_used": 0,
            "current_streak": 0,
            "max_streak": 0,
            "error": str(e)
        }

# ---------------- Security Functions ----------------

# ---------------- Get risky tokens ----------------
def get_risk_tokens(address: str) -> str:
    """
    Check for risky tokens in a wallet address on Base network.
    
    Args:
        address (str): Ethereum wallet address or Basename to check
        
    Returns:
        str: "risky_tokens = score(count)" format
             Example: "risky_tokens = 1.27(127)"
    """
    try:
        # Resolve Basename to address if needed
        resolved = resolve_input_basename_address(address)
        actual_address = resolved.get("Address")
        
        if not actual_address or actual_address in (None, "", "0x0000000000000000000000000000000000000000"):
            return "risky_tokens = 0.00(0)"
        
        # Configuration for Base network using Etherscan v2 API
        # Use global ETHERSCAN_API_KEY
        ETHERSCAN_BASE_URL = "https://api.etherscan.io/v2/api"
        CHAIN_ID = 8453  # Base network chain ID
        
        # Prepare API request for Base network using v2 API
        params = {
            "chainid": CHAIN_ID,  # Specify Base network
            "module": "account",
            "action": "tokentx",  # Get token transactions
            "address": actual_address,
            "startblock": 0,
            "endblock": 99999999,
            "sort": "desc",
            "tag": "latest",
            "apikey": ETHERSCAN_API_KEY
        }
        
        # Make API request to Base network using v2 API with connection pooling
        response = session.get(ETHERSCAN_BASE_URL, params=params, timeout=30)
        
        # Check if request was successful
        if response.status_code != 200:
            error_msg = f"API request failed with status code: {response.status_code}"
            print(f"ERROR: {error_msg}")
            return "risky_tokens = 0.00(0)"
        
        # Parse API response
        data = response.json()
        
        # Check API response status
        if data.get("status") != "1":
            error_msg = f"API returned error: {data.get('message', 'Unknown error')}"
            print(f"ERROR: {error_msg}")
            return "risky_tokens = 0.00(0)"
        
        # Get transaction list
        transactions = data.get("result", [])
        
        # Define risky token patterns (case insensitive)
        # High risk patterns (scam indicators)
        high_risk_patterns = [
            "honeypot", "scam", "fake", "rug", "suspicious"
        ]
        
        # Medium risk patterns (meme coins - user might be aware)
        medium_risk_patterns = [
            "moon", "inu", "elon", "doge", "shib", "pepe",
            "meme", "rocket", "safe", "baby", "mini"
        ]
        
        # New patterns for better detection
        new_risk_patterns = [
            "claim", "airdrop", "reward", "swap", "visit",
            "free", "gift", "bonus", "earn", "profit"
        ]
        
        # Known scam token addresses (example - in production, this would be a database)
        known_scam_tokens = [
            "0x1234567890123456789012345678901234567890",  # Example scam token
        ]
        
        # Initialize tracking variables
        risky_tokens_found = set()
        risky_tokens_details = []
        total_tokens_checked = set()
        
        # Analyze each token transaction (optimized for speed)
        for tx in transactions:
            token_address = tx.get("contractAddress", "").lower()
            token_name = tx.get("tokenName", "").lower()
            token_symbol = tx.get("tokenSymbol", "").lower()
            token_value = tx.get("value", "0")
            
            # Skip if we already checked this token
            if token_address in total_tokens_checked:
                continue
                
            total_tokens_checked.add(token_address)
            token_risk_score = 0
            risk_reasons = []
            risk_level = "low"  # low, medium, high
            
            # 1. Check if token is in known scam list (HIGH RISK)
            if token_address in known_scam_tokens:
                token_risk_score += 40
                risk_reasons.append("Known scam token")
                risk_level = "high"
            
            # 2. Check for high risk patterns (scam indicators)
            for pattern in high_risk_patterns:
                if pattern in token_name or pattern in token_symbol:
                    token_risk_score += 30
                    risk_reasons.append(f"Contains high-risk pattern: '{pattern}'")
                    risk_level = "high"
                    break
            
            # 3. Check for medium risk patterns (meme coins - user might be aware)
            for pattern in medium_risk_patterns:
                if pattern in token_name or pattern in token_symbol:
                    token_risk_score += 15  # Reduced from 25
                    risk_reasons.append(f"Contains meme pattern: '{pattern}' (user might be aware)")
                    risk_level = "medium"
                    break
            
            # 4. Check for new risk patterns (claim, airdrop, etc.)
            for pattern in new_risk_patterns:
                if pattern in token_name or pattern in token_symbol:
                    token_risk_score += 20
                    risk_reasons.append(f"Contains suspicious pattern: '{pattern}'")
                    risk_level = "medium"
                    break
            
            # 5. Check for suspicious token characteristics
            if len(token_symbol) > 15:  # Unusually long symbol
                token_risk_score += 10  # Reduced from 15
                risk_reasons.append("Unusually long symbol")
            
            # 6. Check for tokens with zero value transfers (potential honeypot)
            if token_value == "0":
                token_risk_score += 15  # Reduced from 20
                risk_reasons.append("Zero value transfer (potential honeypot)")
            
            # 7. Enhanced honeypot detection
            # Check for tokens with very low liquidity or suspicious transfer patterns
            if token_value != "0" and int(token_value) < 1000000:  # Very small amounts
                token_risk_score += 10
                risk_reasons.append("Very small transfer amount (suspicious)")
            
            # Only add to risk score if this token is actually risky
            if token_risk_score > 0:
                risky_tokens_found.add(token_address)
                
                # Store detailed information about risky token
                risky_tokens_details.append({
                    'address': token_address,
                    'name': tx.get("tokenName", "Unknown"),
                    'symbol': tx.get("tokenSymbol", "Unknown"),
                    'risk_score': token_risk_score,
                    'risk_level': risk_level,
                    'risk_reasons': risk_reasons
                })
        
        # NEW SCORING SYSTEM: 0.005 points per risky token (max 3 points total)
        final_risk_score = min(3.0, len(risky_tokens_found) * 0.005)

        # Prepare result
        result = {
            'risk_score': final_risk_score,
            'total_tokens_checked': len(total_tokens_checked),
            'risky_tokens_found': len(risky_tokens_found),
            'risky_tokens_list': risky_tokens_details,
            'status': 'success',
            'error_message': None
        }
        
        # Create CSV file for risky tokens details
        csv_filename = f"risky_tokens_{actual_address}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        # Use absolute path to ensure we're saving in the right directory
        base_dir = Path(__file__).parent.parent.parent  # Go up to project root
        data_dir = base_dir / "data" / "security_reports"
        data_dir.mkdir(parents=True, exist_ok=True)
        csv_path = data_dir / csv_filename
        
        # Save risky tokens to CSV
        if risky_tokens_details:
            with open(csv_path, 'w', newline='', encoding='utf-8') as csvfile:
                fieldnames = ['Token Name', 'Token Symbol', 'Contract Address', 'Risk Level', 'Risk Score', 'Risk Reasons']
                writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
                
                writer.writeheader()
                for token in risky_tokens_details:
                    writer.writerow({
                        'Token Name': token['name'],
                        'Token Symbol': token['symbol'],
                        'Contract Address': token['address'],
                        'Risk Level': token['risk_level'].upper(),
                        'Risk Score': token['risk_score'],
                        'Risk Reasons': '; '.join(token['risk_reasons'])
                    })
        
        # Prepare clean result
        result = {
            'risk_score': final_risk_score,
            'total_tokens_checked': len(total_tokens_checked),
            'risky_tokens_found': len(risky_tokens_found),
            'risky_tokens_list': risky_tokens_details,
            'csv_file': csv_path if risky_tokens_details else None,
            'status': 'success',
            'error_message': None
        }
        
        # Return simple result
        return f"risky_tokens = {final_risk_score:.2f}({len(risky_tokens_found)})"
        
    except requests.exceptions.Timeout:
        error_msg = "API request timed out"
        print(f"❌ {error_msg}")

        return "risky_tokens = 0.00(0)"

    except requests.exceptions.RequestException as e:
        error_msg = f"Network error: {str(e)}"
        print(f"❌ {error_msg}")

        return "risky_tokens = 0.00(0)"

    except Exception as e:
        error_msg = f"Unexpected error: {str(e)}"
        print(f"❌ {error_msg}")

        return "risky_tokens = 0.00(0)"

# ---------------- Get risky contracts ----------------
def get_risky_contracts(address: str) -> dict:
    """
    Fast contract risk analysis for Base network.
    Optimized for speed - completes in under 30 seconds.
    
    Args:
        address (str): The wallet address or Basename to analyze
        
    Returns:
        dict: Contains count and weighted score for risky contracts
    """
    try:
        # Resolve Basename to address if needed
        resolved = resolve_input_basename_address(address)
        actual_address = resolved.get("Address")
        
        if not actual_address or actual_address in (None, "", "0x0000000000000000000000000000000000000000"):
            return {
                "count": 0,
                "weighted_score": 0.0,
                "error": "Could not resolve a valid address from input."
            }
        
        # Get transactions (async, max 30 seconds total)
        transactions = asyncio.run(get_all_transactions_async(actual_address))
        
        if not transactions:
            return {"count": 0, "weighted_score": 0.0}
        
        # Extract contracts (no API calls)
        contract_addresses = extract_contract_interactions(transactions, actual_address)
        
        if not contract_addresses:
            return {"count": 0, "weighted_score": 0.0}
        
        # Fast analysis using only transaction data
        risky_contracts_data = []
        risky_count = 0
        weighted_score = 0.0
        
        for contract_addr in contract_addresses:
            risk_assessment = analyze_contract_risk_fast(contract_addr, transactions)
            
            # Lower threshold for speed
            if risk_assessment['risk_score'] >= 20:
                risky_count += 1
                
                # Convert score to risk level and calculate weighted score
                risk_level = get_risk_level(risk_assessment['risk_score'])
                weight = get_risk_weight(risk_level)
                weighted_score += weight
                
                # Add to data for CSV
                risky_contracts_data.append({
                    'contract_address': contract_addr,
                    'risk_score': risk_assessment['risk_score'],
                    'risk_level': risk_level,
                    'risk_factors': ', '.join(risk_assessment['risk_factors']),
                    'interaction_count': risk_assessment['interaction_count'],
                    'analysis_date': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                })
            
        # Save to CSV if risky contracts found
        if risky_contracts_data:
            save_risky_contracts_to_csv(actual_address, risky_contracts_data)
        
        return {
            "count": risky_count,
            "weighted_score": round(weighted_score, 2)
        }
        
    except Exception as e:
        print(f"Error in get_risky_contracts: {e}")
        return {"count": 0, "weighted_score": 0.0}

def get_risk_level(score: int) -> str:
    """Convert risk score to risk level"""
    if score >= 50:
        return "High"
    elif score >= 30:
        return "Mid"
    else:
        return "Low"

def get_risk_weight(risk_level: str) -> float:
    """Get weight for risk level"""
    weights = {
        "Low": 0.05,
        "Mid": 0.08,
        "High": 1.0
    }
    return weights.get(risk_level, 0.0)

def save_risky_contracts_to_csv(address: str, risky_contracts_data: list):
    """Save risky contracts data to CSV file"""
    try:
        # Create data directory if it doesn't exist
        # Use absolute path to ensure we're saving in the right directory
        base_dir = Path(__file__).parent.parent.parent  # Go up to project root
        data_dir = base_dir / "data" / "security_reports"
        data_dir.mkdir(parents=True, exist_ok=True)
        
        # Generate filename with timestamp
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"risky_contracts_{address}_{timestamp}.csv"
        filepath = data_dir / filename
        
        # Write to CSV
        with open(filepath, 'w', newline='', encoding='utf-8') as csvfile:
            fieldnames = ['contract_address', 'risk_score', 'risk_level', 'risk_factors', 'interaction_count', 'analysis_date']
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            
            writer.writeheader()
            for contract_data in risky_contracts_data:
                writer.writerow(contract_data)
        
    except Exception as e:
        print(f"Error saving risky contracts data to CSV: {e}")

async def get_all_transactions_async(address: str) -> list:
    """Async version with concurrent requests and better error handling"""
    try:
        async with aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=15, connect=10)
        ) as session:
            tasks = []
            for page in range(1, 3):  # Only 2 pages max
                task = fetch_page_async(session, address, page)
                tasks.append(task)
            
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            all_txs = []
            for i, result in enumerate(results, 1):
                if isinstance(result, list):
                    all_txs.extend(result)
                elif isinstance(result, Exception):
                    print(f"Error fetching transaction page {i}: {result}")
            
            return all_txs[:1000]  # Limit total transactions
            
    except Exception as e:
        print(f"Error in fetch_page_async: {e}")
        return []

async def fetch_page_async(session, address: str, page: int) -> list:
    """Fetch single page asynchronously with improved error handling"""
    url = "https://base.blockscout.com/api"
    params = {
        "module": "account",
        "action": "txlist", 
        "address": address,
        "page": page,
        "offset": 500,
        "sort": "desc"
    }
    
    try:
        async with session.get(url, params=params) as response:
            if response.status != 200:
                return []
            
            data = await response.json()
            if data.get('status') == "1":
                return data.get('result', [])
            else:
                return []
                
    except asyncio.TimeoutError:
        # Retry once
        try:
            async with session.get(url, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    if data.get('status') == "1":
                        return data.get('result', [])
        except Exception as retry_err:
            print(f"Error in retry attempt for fetch_page_async: {retry_err}")
        return []
    except Exception as e:
        print(f"Error in fetch_page_async: {e}")
        return []

# ---------------- Analyze contract risk fast ----------------
def analyze_contract_risk_fast(contract_addr: str, user_transactions: list) -> dict:
    """Fast risk analysis using only transaction data - no additional API calls"""
    risk_score = 0
    risk_factors = []
    
    # Filter transactions for this contract
    contract_txs = [tx for tx in user_transactions if tx.get('to', '').lower() == contract_addr.lower()]
    
    # 1. Transaction frequency analysis
    if len(contract_txs) == 1:
        risk_score += 15
        risk_factors.append("SINGLE_INTERACTION")
    
    # 2. Gas usage patterns
    gas_values = [int(tx.get('gasUsed', 0)) for tx in contract_txs]
    if gas_values:
        avg_gas = sum(gas_values) / len(gas_values)
        if avg_gas > 500000:  # Very high gas usage
            risk_score += 10
            risk_factors.append("HIGH_GAS_USAGE")
    
    # 3. Value transfer patterns
    values = [int(tx.get('value', 0)) for tx in contract_txs]
    if values and max(values) > 0:
        max_value_eth = max(values) / 1e18
        if max_value_eth > 1:  # > 1 ETH
            risk_score += 5
            risk_factors.append("LARGE_VALUE_TRANSFER")
    
    # 4. Recent interaction analysis
    timestamps = [int(tx.get('timeStamp', 0)) for tx in contract_txs]
    if timestamps:
        latest_interaction = max(timestamps)
        days_since = (time.time() - latest_interaction) / 86400
        if days_since < 1:  # Very recent
            risk_score += 8
            risk_factors.append("VERY_RECENT_INTERACTION")
    
    # 5. Input data complexity
    input_lengths = [len(tx.get('input', '0x')) for tx in contract_txs]
    if input_lengths:
        avg_input_length = sum(input_lengths) / len(input_lengths)
        if avg_input_length < 10:  # Very simple calls
            risk_score += 12
            risk_factors.append("SIMPLE_CALLS_ONLY")
    
    # 6. Suspicious address patterns
    suspicious_patterns = [
        r'dead', r'0000', r'1111', r'2222', r'3333', r'4444', 
        r'5555', r'6666', r'7777', r'8888', r'9999', r'aaaa',
        r'bbbb', r'cccc', r'dddd', r'eeee', r'ffff'
    ]
    
    for pattern in suspicious_patterns:
        if re.search(pattern, contract_addr.lower()):
            risk_score += 15
            risk_factors.append("SUSPICIOUS_ADDRESS_PATTERN")
            break
    
    return {
        'contract_address': contract_addr,
        'risk_score': min(risk_score, 100),
        'risk_factors': risk_factors,
        'interaction_count': len(contract_txs)
    }

def extract_contract_interactions(transactions: list, user_address: str) -> set:
    """Extract unique contract addresses from transactions"""
    contract_addresses = set()
    
    for tx in transactions:
        to_address = tx.get('to', '').lower().strip()
        
        # Check if it's a contract interaction (not just a transfer)
        if (to_address and 
            to_address != '0x' and 
            to_address != user_address.lower() and
            tx.get('input', '0x') != '0x'):  # Has input data = contract interaction
            
            contract_addresses.add(to_address)
    
    return contract_addresses




def get_risky_signs(address: str) -> dict:
    """
    Analyze wallet for risky signatures and approvals - Free User Version.
    Simplified analysis focusing on dangerous approval patterns.
    Returns simple count and detailed analysis in background CSV.
    """
    try:
        # Resolve Basename to address if needed
        resolved = resolve_input_basename_address(address)
        actual_address = resolved.get("Address")
        
        if not actual_address or actual_address in (None, "", "0x0000000000000000000000000000000000000000"):
            return {
                "wallet_address": address,
                "risky_signs": 0,
                "weighted_score": 0,
                "error": "Could not resolve a valid address from input."
            }
        
        # Get transactions
        transactions = get_all_transactions(actual_address)
        if not transactions:
            return {"wallet_address": actual_address, "risky_signs": 0, "weighted_score": 0}
        
        # Analyze for risky signatures
        risky_signs = []
        
        for tx in transactions:
            if tx.get('from', '').lower() != actual_address.lower():
                continue
                
            to_address = tx.get('to', '').lower()
            input_data = tx.get('input', '0x')
            
            if len(input_data) < 10:
                continue
                
            func_signature = input_data[:10]
            
            # Check for dangerous signatures
            dangerous_signatures = [
                "0x095ea7b3",  # approve
                "0xd505accf",  # permit
                "0xa22cb465",  # setApprovalForAll
                "0xac9650d8",  # multicall
                "0x1cff79cd",  # execute
                "0x40c10f19",  # mint
            ]
            
            if func_signature in dangerous_signatures:
                # Analyze signature risk
                signature_analysis = analyze_signature_risk(input_data, to_address, func_signature)
                
                # Calculate risk score with spender address for protocol safety check
                spender_address = signature_analysis.get('spender_address', '')
                risk_score, risk_level = calculate_risk_score(func_signature, signature_analysis['risk_factors'], spender_address)
                
                # Only include if risk score is meaningful
                if risk_score >= 15:
                    risky_signs.append({
                        'contract_address': to_address,
                        'function_signature': func_signature,
                        'function_name': get_function_name(func_signature),
                        'risk_level': risk_level,
                        'risk_score': risk_score,
                        'risk_factors': signature_analysis['risk_factors'],
                        'transaction_hash': tx.get('hash', ''),
                        'timestamp': int(tx.get('timeStamp', 0)),
                        'approval_amount': signature_analysis.get('approval_amount', 'Unknown'),
                        'spender_address': signature_analysis.get('spender_address', 'Unknown'),
                        'is_unlimited': signature_analysis.get('is_unlimited', False)
                    })
        
        # Group by unique patterns
        unique_risky_patterns = group_risky_signs(risky_signs)
        
        # Save detailed report to CSV (background)
        if unique_risky_patterns:
            save_risky_signs_to_csv(actual_address, unique_risky_patterns)
        
        # Calculate weighted score with diminishing returns to prevent excessive deductions
        total_weighted_score = 0
        for pattern in unique_risky_patterns:
            risk_level = pattern['risk_level']
            if risk_level == "MINIMAL":
                total_weighted_score += 0.8
            elif risk_level == "LOW":
                total_weighted_score += 0.9
            elif risk_level == "MEDIUM":
                total_weighted_score += 1.0
            elif risk_level == "HIGH":
                total_weighted_score += 1.2
        
        # Apply diminishing returns: log-based scaling to prevent excessive deductions
        # This ensures that even many risky signs don't completely destroy the score
        if total_weighted_score > 0:
            # Use log scaling: log(1 + total_score) * 2.5
            # This caps the maximum deduction at around 8-10 points even for many risky signs
            weighted_score = min(8.0, (total_weighted_score ** 0.6) * 1.5)
        else:
            weighted_score = 0
        
        # Return simple format with weighted score
        return {
            "wallet_address": actual_address,
            "risky_signs": len(unique_risky_patterns),
            "weighted_score": round(weighted_score, 2)
        }
        
    except Exception as e:
        print(f"Error in get_risky_signs: {e}")
        return {"wallet_address": address, "risky_signs": 0, "weighted_score": 0, "error": str(e)}

# Known safe protocols (reduce risk for these)
KNOWN_SAFE_PROTOCOLS = {
    "0x4200000000000000000000000000000000000006",  # WETH9
    "0x198ef79f1f515f02dfe9e3115ed9fc07183f02fc",  # Uniswap Universal Router
    "0x2626664c2603336e57b271c5c0b26f421741e481",  # Uniswap SwapRouter
    "0x827922686190790b37229fd06084350e74485b72",  # Aerodrome Router
    "0x1111111254eeb25477b68fb85ed929f73a960582",  # 1inch Router
    "0xbbbbbbbbbb9cc5e90e3b3af64bdaf62c37eeffcb",  # Morpho Blue
    "0x00000000000001ad428e4906ae43d8f9852d0dd6",  # OpenSea Seaport
    "0x7c74dfe39976dc395529c14e54a597809980e01c",  # Zora
    "0x3154cf16ccdb4c6d922629664174b904d80f2c35",  # Base L1 Bridge
    "0x8731d54e9d02c286767d56ac03e8037c07e01e98",  # Stargate
    "0x66a71dcef29a0ffbdbe3c6a460a3b5bc225cd675",  # LayerZero
    "0xca11bde05977b3631167028862be2a173976ca11",  # Multicall3
    "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",  # USDC on Base
    "0x50c5725949a6f0c72e6c4a641f24049a917db0cb",  # DAI on Base
    "0x2ae3f1ec7f1f5012cfeab0185bfc7aa3cf0dec22",  # cbETH on Base
}

def get_function_name(signature: str) -> str:
    """Get human-readable function name"""
    names = {
        "0x095ea7b3": "approve",
        "0xd505accf": "permit", 
        "0xa22cb465": "setApprovalForAll",
        "0xac9650d8": "multicall",
        "0x1cff79cd": "execute",
        "0x40c10f19": "mint",
    }
    return names.get(signature, "unknown")

def analyze_approval_amount(amount_hex: str) -> dict:
    """Analyze approval amount for risk"""
    try:
        amount = int(amount_hex, 16)
        max_uint256 = 2**256 - 1
        
        if amount >= max_uint256:
            return {"is_unlimited": True, "risk_score": 50}
        elif amount >= max_uint256 * 0.99:
            return {"is_unlimited": True, "risk_score": 45}
        elif amount > 10**30:
            return {"is_unlimited": False, "risk_score": 30}
        elif amount > 10**24:
            return {"is_unlimited": False, "risk_score": 20}
        else:
            return {"is_unlimited": False, "risk_score": 0}
    except:
        return {"is_unlimited": False, "risk_score": 5}

def calculate_risk_score(func_signature: str, risk_factors: list, spender_address: str = "") -> tuple:
    """Calculate simple risk score with protocol safety check"""
    base_scores = {
        "0x095ea7b3": 25,  # approve
        "0xd505accf": 35,  # permit
        "0xa22cb465": 30,  # setApprovalForAll
        "0xac9650d8": 20,  # multicall
        "0x1cff79cd": 15,  # execute
        "0x40c10f19": 20,  # mint
    }
    
    base_score = base_scores.get(func_signature, 10)
    
    # Apply multipliers for risk factors
    for factor in risk_factors:
        if "UNLIMITED" in factor:
            base_score *= 1.5
        elif "MALICIOUS" in factor:
            base_score *= 2.0
        elif "SUSPICIOUS" in factor:
            base_score *= 1.3
        elif "UNVERIFIED" in factor:
            base_score *= 1.2
    
    # Reduce risk for known safe protocols
    if spender_address and spender_address.lower() in KNOWN_SAFE_PROTOCOLS:
        base_score *= 0.6  # Reduce risk for known protocols
    
    # Cap at 100
    final_score = min(int(base_score), 100)
    
    # Determine risk level
    if final_score >= 70:
        risk_level = "HIGH"
    elif final_score >= 40:
        risk_level = "MEDIUM"
    elif final_score >= 20:
        risk_level = "LOW"
    else:
        risk_level = "MINIMAL"
    
    return final_score, risk_level

def analyze_signature_risk(input_data: str, contract_address: str, func_signature: str) -> dict:
    """Analyze signature for risk factors"""
    risk_factors = []
    approval_amount = "Unknown"
    spender_address = "Unknown"
    is_unlimited = False
    
    try:
        if func_signature == "0x095ea7b3":  # approve
            if len(input_data) >= 74:
                # Extract spender address
                spender_hex = input_data[34:74]
                spender_address = "0x" + spender_hex[-40:]
                
                # Extract amount
                amount_hex = input_data[-64:]
                approval_analysis = analyze_approval_amount(amount_hex)
                approval_amount = amount_hex
                is_unlimited = approval_analysis['is_unlimited']
                
                if is_unlimited:
                    risk_factors.append("UNLIMITED_APPROVAL")
                
                # Check for suspicious patterns
                if re.search(r'dead|0000|1111|2222|3333|4444|5555|6666|7777|8888|9999|aaaa|bbbb|cccc|dddd|eeee|ffff', spender_address):
                    risk_factors.append("SUSPICIOUS_SPENDER_ADDRESS")
        
        elif func_signature == "0xa22cb465":  # setApprovalForAll
            if len(input_data) >= 74:
                operator_hex = input_data[34:74]
                spender_address = "0x" + operator_hex[-40:]
                
                status_hex = input_data[-64:]
                status = int(status_hex, 16)
                
                if status == 1:
                    risk_factors.append("NFT_APPROVAL_FOR_ALL")
                    
                    if re.search(r'dead|0000|1111|2222|3333|4444|5555|6666|7777|8888|9999|aaaa|bbbb|cccc|dddd|eeee|ffff', spender_address):
                        risk_factors.append("SUSPICIOUS_NFT_OPERATOR")
        
        elif func_signature == "0xd505accf":  # permit
            risk_factors.append("GASLESS_APPROVAL")
            
            if len(input_data) >= 200:
                spender_hex = input_data[34:74]
                spender_address = "0x" + spender_hex[-40:]
                
                value_hex = input_data[74:138]
                approval_analysis = analyze_approval_amount(value_hex)
                approval_amount = value_hex
                is_unlimited = approval_analysis['is_unlimited']
                
                if is_unlimited:
                    risk_factors.append("UNLIMITED_GASLESS_APPROVAL")
        
        elif func_signature == "0xac9650d8":  # multicall
            risk_factors.append("BATCH_OPERATION")
            
            if input_data.count("0x095ea7b3") > 1:
                risk_factors.append("MULTIPLE_APPROVALS_IN_BATCH")
    
    except Exception as e:
        risk_factors.append(f"DECODE_ERROR: {str(e)}")
    
    return {
        'risk_factors': risk_factors,
        'approval_amount': approval_amount,
        'spender_address': spender_address,
        'is_unlimited': is_unlimited
    }

def group_risky_signs(risky_signs: list) -> list:
    """Group risky signs by unique patterns"""
    pattern_groups = {}
    
    for sign in risky_signs:
        pattern_key = f"{sign['function_signature']}_{sign['spender_address']}"
        
        if pattern_key not in pattern_groups:
            pattern_groups[pattern_key] = {
                'function_signature': sign['function_signature'],
                'function_name': sign['function_name'],
                'risk_level': sign['risk_level'],
                'risk_score': sign['risk_score'],
                'contract_address': sign['contract_address'],
                'spender_address': sign['spender_address'],
                'approval_amount': sign['approval_amount'],
                'is_unlimited': sign['is_unlimited'],
                'risk_factors': set(sign['risk_factors']),
                'transaction_count': 0,
                'first_signature': float('inf'),
                'last_signature': 0,
                'example_transaction_hash': sign['transaction_hash']
            }
        
        group = pattern_groups[pattern_key]
        group['transaction_count'] += 1
        group['first_signature'] = min(group['first_signature'], sign['timestamp'])
        group['last_signature'] = max(group['last_signature'], sign['timestamp'])
        group['risk_factors'].update(sign['risk_factors'])
        group['risk_score'] = max(group['risk_score'], sign['risk_score'])
    
    # Convert to final format
    return sorted([
        {
            'function_signature': group['function_signature'],
            'function_name': group['function_name'],
            'risk_level': group['risk_level'],
            'risk_score': group['risk_score'],
            'contract_address': group['contract_address'],
            'spender_address': group['spender_address'],
            'approval_amount': group['approval_amount'],
            'is_unlimited': group['is_unlimited'],
            'risk_factors': list(group['risk_factors']),
            'transaction_count': group['transaction_count'],
            'first_signature': int(group['first_signature']) if group['first_signature'] != float('inf') else 0,
            'last_signature': int(group['last_signature']),
            'example_transaction_hash': group['example_transaction_hash']
        }
        for group in pattern_groups.values()
    ], key=lambda x: x['risk_score'], reverse=True)

def save_risky_signs_to_csv(address: str, risky_signs: list):
    """Save risky signs data to CSV file"""
    try:
        # Create data directory if it doesn't exist
        # Use absolute path to ensure we're saving in the right directory
        base_dir = Path(__file__).parent.parent.parent  # Go up to project root
        data_dir = base_dir / "data" / "security_reports"
        data_dir.mkdir(parents=True, exist_ok=True)
        
        # Generate filename with timestamp
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"risky_signs_{address}_{timestamp}.csv"
        filepath = data_dir / filename
        
        # Write to CSV
        with open(filepath, 'w', newline='', encoding='utf-8') as csvfile:
            fieldnames = [
                'function_signature', 'function_name', 'risk_level', 'risk_score',
                'contract_address', 'spender_address', 'approval_amount', 'is_unlimited',
                'risk_factors', 'transaction_count', 'first_signature', 'last_signature',
                'example_transaction_hash'
            ]
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            
            writer.writeheader()
            for sign_data in risky_signs:
                # Convert risk_factors list to string
                sign_data_copy = sign_data.copy()
                sign_data_copy['risk_factors'] = '; '.join(sign_data['risk_factors'])
                writer.writerow(sign_data_copy)
        
    except Exception as e:
        print(f"Error saving risky signs CSV: {e}")

def get_suspicious_nfts(address: str) -> str:
    """
    Check for suspicious NFTs in a wallet address on Base network.
    
    Args:
        address (str): Ethereum wallet address or Basename to check
        
    Returns:
        str: "risky_nft: count" format
             Example: "risky_nft: 145"
    """
    try:
        # Resolve Basename to address if needed
        resolved = resolve_input_basename_address(address)
        actual_address = resolved.get("Address")
        
        # Validate address format
        if not actual_address or not actual_address.startswith('0x') or len(actual_address) != 42:
            return "risky_nft: 0"
        
        # Configuration for Base network using Etherscan v2 API
        # Use global ETHERSCAN_API_KEY
        ETHERSCAN_BASE_URL = "https://api.etherscan.io/v2/api"
        CHAIN_ID = 8453  # Base network chain ID
        
        # Prepare API request for Base network using v2 API
        params = {
            "chainid": CHAIN_ID,  # Specify Base network
            "module": "account",
            "action": "tokennfttx",  # Get NFT token transactions
            "address": actual_address,
            "startblock": 0,
            "endblock": 99999999,
            "sort": "desc",
            "tag": "latest",
            "apikey": ETHERSCAN_API_KEY
        }
        
        # Make API request with retry mechanism
        max_retries = 3
        for attempt in range(max_retries):
            try:
                # Add rate limiting delay
                if attempt > 0:
                    time.sleep(1)  # 1 second delay between retries
                
                response = session.get(ETHERSCAN_BASE_URL, params=params, timeout=30)
                
                # Check if request was successful
                if response.status_code != 200:
                    error_msg = f"API request failed with status code: {response.status_code}"
                    if attempt == max_retries - 1:
                        return f"Error: {error_msg}"
                    continue
                
                # Parse API response
                data = response.json()
                
                # Check API response status
                if data.get("status") != "1":
                    error_msg = f"API returned error: {data.get('message', 'Unknown error')}"
                    if attempt == max_retries - 1:
                        return f"Error: {error_msg}"
                    continue
                
                # If we reach here, API call was successful
                break
                
            except requests.exceptions.Timeout:
                error_msg = "API request timed out"
                if attempt == max_retries - 1:
                    return f"Error: {error_msg}"
                continue
                
            except requests.exceptions.RequestException as e:
                error_msg = f"Network error: {str(e)}"
                if attempt == max_retries - 1:
                    return f"Error: {error_msg}"
                continue
        
        # Get transaction list
        transactions = data.get("result", [])
        
        # Define suspicious NFT patterns (case insensitive) - IMPROVED
        # High risk patterns (scam indicators)
        high_risk_patterns = [
            "honeypot", "scam", "fake", "rug", "suspicious", "phishing",
            "malware", "virus", "trojan", "stealer", "drainer", "drain",
            "fake_", "clone_", "copy_", "replica_", "fake_", "scam_"
        ]
        
        # Medium risk patterns (suspicious but not necessarily malicious)
        medium_risk_patterns = [
            "claim", "airdrop", "reward", "free", "gift", "bonus",
            "earn", "profit", "mint", "mintable", "mintpass",
            "whitelist", "presale", "private", "exclusive",
            "free_mint", "airdrop_nft", "claim_reward", "free_gift"
        ]
        
        # Low risk patterns (potentially suspicious) - REMOVED GENERAL PATTERNS
        low_risk_patterns = [
            "limited", "rare", "unique", "special", "vip",
            "golden", "premium", "elite", "legendary", "mythic"
        ]
        
        # Enhanced fake collection detection
        FAKE_COLLECTIONS = [
            "bored ape", "cryptopunk", "azuki", "doodles", "moonbird",
            "clone x", "pudgy penguin", "mutant ape", "bayc", "mayc",
            "bored ape yacht club", "cryptopunks", "azuki elementals"
        ]
        
        # Known legitimate Base collections (reduce false positives)
        LEGITIMATE_BASE_NFTS = {
            "0x4ed4e862860bed51a9570b96d89af5e1b0efefed",  # DEGEN
            "0x03a520b32c04bf3beef7beb72e919cf822ed34f1",  # Base, Introduced
        }
        
        # Known scam NFT addresses (example - in production, this would be a database)
        known_scam_nfts = [
            "0x1234567890123456789012345678901234567890",  # Example scam NFT
        ]
        
        # Initialize tracking variables
        suspicious_nfts_found = set()
        suspicious_nfts_details = []
        total_nfts_checked = set()
        
        # Analyze each NFT transaction
        for tx in transactions:
            nft_address = tx.get("contractAddress", "").lower()
            nft_name = tx.get("tokenName", "").lower()
            nft_symbol = tx.get("tokenSymbol", "").lower()
            token_id = tx.get("tokenID", "")
            token_value = tx.get("value", "0")
            from_address = tx.get("from", "").lower()
            to_address = tx.get("to", "").lower()
            
            # Skip if we already checked this NFT
            if nft_address in total_nfts_checked:
                continue
                
            total_nfts_checked.add(nft_address)
            nft_risk_score = 0
            risk_reasons = []
            risk_level = "low"  # low, medium, high
            
            # Determine if user minted or received the NFT
            user_address = actual_address.lower()
            is_user_minted = (from_address == user_address)
            is_user_received = (to_address == user_address)
            
            # Base risk score based on transaction type
            if is_user_minted:
                nft_risk_score += 30  # Higher risk for user-minted NFTs
                risk_reasons.append("User minted NFT (higher risk)")
                risk_level = "high"
            elif is_user_received:
                nft_risk_score += 15  # Lower risk for received NFTs
                risk_reasons.append("Received NFT (lower risk)")
                risk_level = "medium"
            
            # 1. Check if NFT is in known scam list (HIGH RISK)
            if nft_address in known_scam_nfts:
                nft_risk_score += 50
                risk_reasons.append("Known scam NFT")
                risk_level = "high"
            
            # 2. Check for high risk patterns (scam indicators)
            for pattern in high_risk_patterns:
                if pattern in nft_name or pattern in nft_symbol:
                    nft_risk_score += 40
                    risk_reasons.append(f"Contains high-risk pattern: '{pattern}'")
                    risk_level = "high"
                    break
            
            # 3. Check for medium risk patterns (suspicious but not necessarily malicious)
            for pattern in medium_risk_patterns:
                if pattern in nft_name or pattern in nft_symbol:
                    nft_risk_score += 25
                    risk_reasons.append(f"Contains suspicious pattern: '{pattern}'")
                    risk_level = "medium"
                    break
            
            # 4. Check for low risk patterns (potentially suspicious) - REDUCED SCORE
            for pattern in low_risk_patterns:
                if pattern in nft_name or pattern in nft_symbol:
                    nft_risk_score += 8  # Reduced from 10
                    risk_reasons.append(f"Contains NFT pattern: '{pattern}'")
                    risk_level = "low"
                    break
            
            # 5. Check for fake collection detection
            for fake_collection in FAKE_COLLECTIONS:
                if fake_collection in nft_name or fake_collection in nft_symbol:
                    nft_risk_score += 35
                    risk_reasons.append(f"Fake collection detected: '{fake_collection}'")
                    risk_level = "high"
                    break
            
            # 6. Check for suspicious NFT characteristics
            if len(nft_symbol) > 20:  # Unusually long symbol
                nft_risk_score += 15
                risk_reasons.append("Unusually long symbol")
            
            # 7. Check for NFTs with zero value transfers (potential honeypot)
            if token_value == "0":
                nft_risk_score += 20
                risk_reasons.append("Zero value transfer (potential honeypot)")
            
            # 8. Check for suspicious token IDs
            if token_id and len(token_id) > 10:  # Unusually long token ID
                nft_risk_score += 10
                risk_reasons.append("Unusually long token ID")
            
            # 9. Check for NFTs with very low liquidity or suspicious transfer patterns
            if token_value != "0" and int(token_value) < 1000000:  # Very small amounts
                nft_risk_score += 15
                risk_reasons.append("Very small transfer amount (suspicious)")
            
            # 10. Check for NFTs with suspicious metadata
            if "metadata" in tx and tx["metadata"]:
                metadata = tx["metadata"].lower()
                if any(pattern in metadata for pattern in high_risk_patterns):
                    nft_risk_score += 30
                    risk_reasons.append("Suspicious metadata content")
                    risk_level = "high"
            
            # 11. Simple non-ASCII detection
            if re.search(r'[^\x00-\x7F]', nft_name):
                nft_risk_score += 20
                risk_reasons.append("Contains non-ASCII characters")
            
            # 12. Check if NFT is in legitimate Base collections (reduce false positives)
            if nft_address in LEGITIMATE_BASE_NFTS:
                nft_risk_score = max(0, nft_risk_score - 30)
                risk_reasons.append("Legitimate Base NFT collection (risk reduced)")
            
            # Only add to risk score if this NFT is actually suspicious
            if nft_risk_score > 0:
                suspicious_nfts_found.add(nft_address)
                
                # Store detailed information about suspicious NFT
                suspicious_nfts_details.append({
                    'address': nft_address,
                    'name': tx.get("tokenName", "Unknown"),
                    'symbol': tx.get("tokenSymbol", "Unknown"),
                    'token_id': token_id,
                    'risk_score': nft_risk_score,
                    'risk_level': risk_level,
                    'risk_reasons': risk_reasons,
                    'transaction_type': 'minted' if is_user_minted else 'received'
                })
        
        # Create CSV file for suspicious NFTs details (background)
        csv_filename = f"suspicious_nfts_{actual_address}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        # Use absolute path to ensure we're saving in the right directory
        base_dir = Path(__file__).parent.parent.parent  # Go up to project root
        data_dir = base_dir / "data" / "security_reports"
        data_dir.mkdir(parents=True, exist_ok=True)
        csv_path = data_dir / csv_filename
        
        # Save suspicious NFTs to CSV (background)
        if suspicious_nfts_details:
            with open(csv_path, 'w', newline='', encoding='utf-8') as csvfile:
                fieldnames = ['NFT Name', 'NFT Symbol', 'Contract Address', 'Token ID', 'Risk Level', 'Risk Score', 'Risk Reasons', 'Transaction Type']
                writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
                
                writer.writeheader()
                for nft in suspicious_nfts_details:
                    writer.writerow({
                        'NFT Name': nft['name'],
                        'NFT Symbol': nft['symbol'],
                        'Contract Address': nft['address'],
                        'Token ID': nft['token_id'],
                        'Risk Level': nft['risk_level'].upper(),
                        'Risk Score': nft['risk_score'],
                        'Risk Reasons': '; '.join(nft['risk_reasons']),
                        'Transaction Type': nft['transaction_type']
                    })
        
        # Return simple result
        return f"risky_nft: {len(suspicious_nfts_found)}"
        
    except requests.exceptions.Timeout:
        error_msg = "API request timed out"
        return f"Error: {error_msg}"

    except requests.exceptions.RequestException as e:
        error_msg = f"Network error: {str(e)}"
        return f"Error: {error_msg}"

    except Exception as e:
        error_msg = f"Unexpected error: {str(e)}"
        return f"Error: {error_msg}"