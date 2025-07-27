# backend/utils/wallet.py

import requests
import base64
from datetime import datetime, timedelta, timezone
from typing import Optional
import time
import json
import os
from backend.core.config import settings

# ---------------- Configuration ----------------
# Alchemy API
ALCHEMY_API_KEY = os.getenv("ALCHEMY_API_KEY", "")
ALCHEMY_BASE = f"https://base-mainnet.g.alchemy.com/v2/{ALCHEMY_API_KEY}"

# Etherscan API
ETHERSCAN_API_KEY = os.getenv("ETHERSCAN_API_KEY", "")
ETHERSCAN_BASE = "https://api.etherscan.io/api"
CHAIN_ID = 8453

# Blockscout API
BLOCKSCOUT_BASE = "https://base.blockscout.com/api/v2"

# Coingecko API
COINGECKO_API = "https://api.coingecko.com/api/v3/simple/token_price/base"

# Zerion API
ZERION_BASE = "https://api.zerion.io/v1"
ZERION_API_KEY = os.getenv("ZERION_API_KEY", "")

ENCODED_KEY = base64.b64encode((ZERION_API_KEY + ":").encode()).decode()
Z_HEADERS = {
    "accept": "application/json",
    "authorization": f"Basic {ENCODED_KEY}"
}

# Web3 setup
# BASE_RPC = "https://mainnet.base.org"
# w3 = Web3(Web3.HTTPProvider(BASE_RPC))

# # Load contract ABIs and addresses
# def load_contract_info(filename):
#     path = os.path.join(os.path.dirname(__file__), "../contracts", filename)
#     with open(path, "r", encoding="utf-8") as f:
#         return json.load(f)

# L2RESOLVER = load_contract_info("L2Resolver.json")
# REVERSEREG = load_contract_info("ReverseRegistrar.json")

# ---------------- Get All Transactions ----------------
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
            res = requests.get(BLOCKSCOUT_BASE, params=params)
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

# ---------------- Get Transaction Count ----------------
def get_total_tx_count(address: str) -> int:
    return len(get_all_transactions(address))

# ---------------- Get Total Gas Used ----------------
def get_total_gas_used(address: str) -> int:
    """
    Returns the total gas paid (gasUsed * gasPrice) for all transactions of the given address on Base network using Blockscout API.
    """
    txs = get_all_transactions(address)
    total_gas_paid = 0
    for tx in txs:
        try:
            # Only transactions sent from this address
            if tx.get('from', '').lower() == address.lower():
                gas_used = int(tx.get('gasUsed', '0'))
                #gas_price = int(tx.get('gasPrice', '0'))
                total_gas_paid += gas_used # * gas_price
        except Exception:
            continue
    return total_gas_paid

# ---------------- Get Current Balance ----------------
def get_current_balance(address: str) -> dict:
    url = f"{ZERION_BASE}/wallets/{address}/portfolio"
    try:
        res = requests.get(url, headers=Z_HEADERS)
        res.raise_for_status()
        data = res.json()
        base_value = data['data']['attributes']['positions_distribution_by_chain']['base']
        return {"base_usd": base_value}
    except Exception as e:
        print(f"[Zerion Portfolio Error] {e}")
        return {"base_usd": 0.0}

# ---------------- Get Past Balance ----------------
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
        res = requests.get(url, headers=Z_HEADERS, params=params)
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

# ---------------- Get Wallet Streaks ----------------
def get_wallet_streaks(address: str, tz: timezone = timezone.utc) -> dict:
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

# ---------------- Get Wallet Age ----------------
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

# # ---------------- Get Address from Basename ----------------
# def resolve_basename_to_address(basename: str) -> Optional[str]:
#     """Convert Basename to Address (Web3.py)."""
#     try:
#         contract = w3.eth.contract(address=L2RESOLVER["address"], abi=L2RESOLVER["abi"])
#         node = namehash(basename)
#         address = contract.functions.addr(node).call()
#         return address
#     except Exception as e:
#         print(f"[ERROR] resolve_basename_to_address: {e}")
#         return None

# # ---------------- Get Basename from Address ----------------
# def get_basename_for_address(address: str) -> Optional[str]:
#     """If the address has a Basename, return it (Web3.py)."""
#     try:
#         contract = w3.eth.contract(address=REVERSEREG["address"], abi=REVERSEREG["abi"])
#         # Convert address to reverse node (requires helper function)
#         reverse_node = namehash(f"{address[2:].lower()}.addr.reverse")
#         basename = contract.functions.name(reverse_node).call()
#         return basename if basename else None
#     except Exception as e:
#         print(f"[ERROR] get_basename_for_address: {e}")
#         return None

# ---------------- Get Wallet Data ----------------
def get_wallet_data(identifier: str) -> dict:
    try:
        address = identifier
        age_days = get_wallet_age(address)
        txs = get_all_transactions(address)
        tx_count = len(txs)
        total_gas_used = get_total_gas_used(address)
        current_balance = get_current_balance(address)
        past_balance = get_past_balance(address)
        streaks = get_wallet_streaks(address)

        return {
            "address": address,
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
            "address": "",
            "tx_count": 0,
            "wallet_age_days": 0,
            "current_balance": 0.0,
            "past_balance": 0.0,
            "total_gas_used": 0,
            "current_streak": 0,
            "max_streak": 0,
        }

# ---------------- Security Mock Functions ----------------
def get_risk_tokens(address: str) -> int:
    return 0
def get_risky_contracts(address: str) -> int:
    return 0
def get_connected_sites(address: str) -> int:
    return 0
def get_risky_signs(address: str) -> int:
    return 0
def get_suspicious_nfts(address: str) -> int:
    return 0