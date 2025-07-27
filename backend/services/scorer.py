from backend.utils.wallet import (
    get_wallet_data, get_risk_tokens,
    get_risky_contracts, get_connected_sites,
    get_risky_signs, get_suspicious_nfts
)
from backend.models.score import ScoreResponse, ScoreBreakdown, SecurityBreakdown

def calculate_score(address: str, include_details: bool = True) -> ScoreResponse:
    data = get_wallet_data(address)

    # Base Score
    tx_score = min(data["tx_count"] / 1000, 1.0) * 15
    gas_score = min(data["total_gas_used"] / 10**7, 1.0) * 10
    current_value_score = min(data["current_balance"] / 10, 1.0) * 15
    past_value_score = min(data["past_balance"] / 10, 1.0) * 10
    streak_score = min(data["current_streak"] / 30, 1.0) * 10
    max_streak_score = min(data["max_streak"] / 90, 1.0) * 10
    age_score = min(data["wallet_age_days"] / 365, 1.0) * 10

    base_score = sum([
        tx_score, gas_score, current_value_score, past_value_score,
        streak_score, max_streak_score, age_score
    ])

    # Security Score
    risky_tokens = get_risk_tokens(address)
    risky_contracts = get_risky_contracts(address)
    phishing_sites = get_connected_sites(address)
    risky_signs = get_risky_signs(address)
    suspicious_nfts = get_suspicious_nfts(address)

    score = 20
    score -= risky_tokens * 1
    score -= risky_contracts * 1
    score -= phishing_sites * 1.5
    score -= risky_signs * 2
    score -= suspicious_nfts * 0.5
    security_score = max(0, round(score, 2))

    total_score = round(base_score + security_score, 2)

    if not include_details:
        return ScoreResponse(
            address=address,
            total_score=total_score,
            base_score=round(base_score, 2),
            security_score=security_score
        )

    return ScoreResponse(
    address=address,
    total_score=total_score,
    base=ScoreBreakdown(
        tx_count=data["tx_count"],
        gas_used=data["total_gas_used"],
        current_balance=data["current_balance"],
        past_balance=data["past_balance"],
        current_streak=data["current_streak"],
        max_streak=data["max_streak"],
        age_days=data["wallet_age_days"],
        base_score=round(base_score, 2)
    ).model_dump(),
    security=SecurityBreakdown(
        risky_tokens=risky_tokens,
        risky_contracts=risky_contracts,
        phishing_sites_connected=phishing_sites,
        risky_signs=risky_signs,
        suspicious_nfts=suspicious_nfts,
        security_score=security_score
    ).model_dump(),
)