# backend/models/score.py

from typing import Optional, Dict, Any
from pydantic import BaseModel, Field

class ScoreBreakdown(BaseModel):
    tx_count: int
    gas_used: float
    current_balance: float
    past_balance: float
    current_streak: int
    max_streak: int
    age_days: int
    base_score: float

class SecurityBreakdown(BaseModel):
    risky_tokens: int
    risky_contracts: int
    risky_signs: int
    suspicious_nfts: int
    security_score: float

class ScoreResponse(BaseModel):
    basename: Optional[str] = None
    address: Optional[str] = None
    total_score: float
    base: Optional[ScoreBreakdown] = None
    security: Optional[SecurityBreakdown] = None
    base_score: Optional[float] = None
    security_score: Optional[float] = None

    class Config:
        exclude_none = True