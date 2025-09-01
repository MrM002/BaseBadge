import asyncio
from concurrent.futures import ThreadPoolExecutor
from functools import lru_cache
from backend.utils.wallet import (
    get_wallet_data, get_risk_tokens,
    get_risky_contracts, get_risky_signs, get_suspicious_nfts
)
from backend.models.score import ScoreResponse, ScoreBreakdown, SecurityBreakdown
from typing import List, Dict, Any
from dataclasses import dataclass

def run_security_functions_parallel(address: str) -> dict:
    """
    Run all security functions in parallel for maximum speed.
    Returns a dictionary with all security analysis results.
    """
    with ThreadPoolExecutor(max_workers=8) as executor:
        # Submit all security functions to run in parallel
        risky_tokens_future = executor.submit(get_risk_tokens, address)
        risky_contracts_future = executor.submit(get_risky_contracts, address)
        risky_signs_future = executor.submit(get_risky_signs, address)
        suspicious_nfts_future = executor.submit(get_suspicious_nfts, address)
        
        # Get results with error handling (reduced timeout for speed)
        try:
            risky_tokens_result = risky_tokens_future.result(timeout=12)
        except Exception as e:
            risky_tokens_result = "risky_tokens = 0.00(0)"
        
        try:
            risky_contracts_result = risky_contracts_future.result(timeout=12)
        except Exception as e:
            risky_contracts_result = {"count": 0, "weighted_score": 0.0}
        
        try:
            risky_signs_result = risky_signs_future.result(timeout=12)
        except Exception as e:
            risky_signs_result = {"risky_signs": 0, "weighted_score": 0.0}
        
        try:
            suspicious_nfts_result = suspicious_nfts_future.result(timeout=12)
        except Exception as e:
            suspicious_nfts_result = "risky_nft: 0"
    
    # Parse risky_tokens result
    try:
        if isinstance(risky_tokens_result, str):
            score_part = risky_tokens_result.split('=')[1].split('(')[0].strip()
            risky_tokens_score = float(score_part)
            
            count_part = risky_tokens_result.split('(')[1].split(')')[0]
            risky_tokens_count = int(count_part)
        else:
            risky_tokens_score = 0.0
            risky_tokens_count = 0
    except Exception as e:
        risky_tokens_score = 0.0
        risky_tokens_count = 0
    
    # Parse risky_contracts result
    risky_contracts_count = risky_contracts_result.get("count", 0)
    risky_contracts_weighted_score = risky_contracts_result.get("weighted_score", 0.0)
    
    # Parse risky_signs result
    risky_signs = risky_signs_result.get("risky_signs", 0)
    risky_signs_weighted_score = risky_signs_result.get("weighted_score", 0.0)
    
    # Parse suspicious_nfts result
    try:
        if suspicious_nfts_result.startswith("risky_nft: "):
            suspicious_nfts_count = int(suspicious_nfts_result.split(": ")[1])
        elif suspicious_nfts_result.startswith("Error: "):
            suspicious_nfts_count = 0
        else:
            suspicious_nfts_count = 0
    except Exception as e:
        suspicious_nfts_count = 0
    
    return {
        "risky_tokens_score": risky_tokens_score,
        "risky_tokens_count": risky_tokens_count,
        "risky_contracts_count": risky_contracts_count,
        "risky_contracts_weighted_score": risky_contracts_weighted_score,
        "risky_signs": risky_signs,
        "risky_signs_weighted_score": risky_signs_weighted_score,
        "suspicious_nfts_count": suspicious_nfts_count
    }

def calculate_score(address: str, include_details: bool = True) -> ScoreResponse:
    data = get_wallet_data(address)

    # ---- Defensive coercion to avoid 500s on missing/None types ----
    try:
        tx_count = int(data.get("tx_count") or 0)
        total_gas_used = float(data.get("total_gas_used") or 0)
        current_balance = float(data.get("current_balance") or 0.0)
        past_balance = float(data.get("past_balance") or 0.0)
        current_streak = int(data.get("current_streak") or 0)
        max_streak = int(data.get("max_streak") or 0)
        age_days = int(data.get("wallet_age_days") or 0)
    except Exception:
        tx_count = 0
        total_gas_used = 0.0
        current_balance = 0.0
        past_balance = 0.0
        current_streak = 0
        max_streak = 0
        age_days = 0

    # Base Score
    tx_score = min(tx_count / 1000, 1.0) * 15
    gas_score = min(total_gas_used / 10**7, 1.0) * 10
    current_value_score = min(current_balance / 10, 1.0) * 15
    past_value_score = min(past_balance / 10, 1.0) * 10
    streak_score = min(current_streak / 30, 1.0) * 10
    max_streak_score = min(max_streak / 90, 1.0) * 10
    age_score = min(age_days / 365, 1.0) * 10

    # Basename bonus: +5 if valid Basename exists
    basename = data.get("Basename") if isinstance(data, dict) else None
    has_valid_basename = (
        isinstance(basename, str)
        and basename
        and not basename.startswith("⛔️")
        and basename.lower().endswith(".base.eth")
    )
    basename_score = 5 if has_valid_basename else 0

    base_score = sum([
        tx_score, gas_score, current_value_score, past_value_score,
        streak_score, max_streak_score, age_score, basename_score
    ])

    # Security Score - PARALLEL EXECUTION
    security_results = run_security_functions_parallel(address)
    
    risky_tokens_score = security_results["risky_tokens_score"]
    risky_tokens_count = security_results["risky_tokens_count"]
    risky_contracts_count = security_results["risky_contracts_count"]
    risky_contracts_weighted_score = security_results["risky_contracts_weighted_score"]
    risky_signs = security_results["risky_signs"]
    risky_signs_weighted_score = security_results["risky_signs_weighted_score"]
    suspicious_nfts_count = security_results["suspicious_nfts_count"]

    # Improved weighting with caps and diminishing returns
    # Base security bucket is 25 points
    score = 25.0
    # Cap each component to avoid over-penalization
    # tokens: 0.005 per token, capped at 3 total (produced upstream)
    score -= min(3.0, risky_tokens_score)
    score -= min(12.0, risky_contracts_weighted_score)  # contracts up to 12
    score -= min(6.0, risky_signs_weighted_score)  # signs up to 6
    # very small per-NFT deduction, capped
    score -= min(1.0, suspicious_nfts_count * 0.01)
    security_score = max(0, round(score, 2))

    total_score = round(base_score + security_score, 2)

    if not include_details:
        return ScoreResponse(
            basename=data.get("Basename") if isinstance(data, dict) else None,
            address=data.get("Address") if isinstance(data, dict) else None,
            total_score=total_score,
            base_score=round(base_score, 2),
            security_score=security_score
        )

    return ScoreResponse(
        basename=data.get("Basename") if isinstance(data, dict) else None,
        address=data.get("Address") if isinstance(data, dict) else None,
        total_score=total_score,
        base_score=round(base_score, 2),
        security_score=security_score,
        base=ScoreBreakdown(
            tx_count=tx_count,
            gas_used=total_gas_used,
            current_balance=current_balance,
            past_balance=past_balance,
            current_streak=current_streak,
            max_streak=max_streak,
            age_days=age_days,
            base_score=round(base_score, 2)
        ).model_dump(),
        security=SecurityBreakdown(
            risky_tokens=risky_tokens_count,
            risky_contracts=risky_contracts_count,
            risky_signs=risky_signs,
            suspicious_nfts=suspicious_nfts_count,
            security_score=security_score
        ).model_dump(),
    )


def derive_badges_from_score(address: str, score: ScoreResponse) -> List[Dict[str, Any]]:
    """
    Simple badge system derived from thresholds. Frontend uses this until on-chain badges are ready.
    """
    total = score.total_score
    base = score.base_score or 0
    sec = score.security_score or 0

    badges: List[Dict[str, Any]] = []

    def add(badge_id: str, name: str, icon: str, description: str, earned: bool):
        badges.append({
            "id": badge_id,
            "name": name,
            "icon": icon,
            "description": description,
            "earned": earned,
        })

    # Dashboard badges (4 main badges)
    add("first_score", "First Score", "🎯", "Calculated your first wallet score", True)
    
    # Get tx_count safely from base object
    tx_count = getattr(score.base, "tx_count", 0) if score.base else 0
    age_days = getattr(score.base, "age_days", 0) if score.base else 0
    
    add("tx_10", "Onboarded", "🚀", "Completed at least 10 transactions", tx_count >= 10)
    add("tx_100", "Active User", "⚡", "Completed at least 100 transactions", tx_count >= 100)
    add("security_guard", "Security Guard", "🛡️", "Security score ≥ 22", sec >= 22)

    # Additional badges for future use
    add("total_bronze", "Bronze Wallet", "🥉", "Total score ≥ 60", total >= 60)
    add("total_silver", "Silver Wallet", "🥈", "Total score ≥ 75", total >= 75)
    add("total_gold", "Gold Wallet", "🥇", "Total score ≥ 85", total >= 85)
    add("security_master", "Security Master", "🧠", "Security score ≥ 24", sec >= 24)
    add("veteran", "Base Veteran", "🏆", "Wallet age ≥ 90 days", age_days >= 90)

    return badges
