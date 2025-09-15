# backend/auth/schemas.py
from pydantic import BaseModel, Field

class NonceResponse(BaseModel):
    address: str
    nonce: str

class VerifyRequest(BaseModel):
    address: str = Field(..., min_length=42, max_length=42)
    signature: str

class TokenResponse(BaseModel):
    token: str
