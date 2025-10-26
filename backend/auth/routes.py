# backend/auth/routes.py
from fastapi import APIRouter, HTTPException, Query, status, Request, Form
from web3 import Web3
from backend.auth.schemas import NonceResponse, VerifyRequest, TokenResponse
from backend.auth.service import create_login_nonce, verify_and_issue_token
from backend.core.config import settings

router = APIRouter(prefix="/auth", tags=["auth"])

@router.get("/nonce", response_model=NonceResponse)
def get_nonce(address: str = Query(min_length=42, max_length=42)):
    if not Web3.is_address(address):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid address")
    nonce = create_login_nonce(address)
    return NonceResponse(address=Web3.to_checksum_address(address), nonce=nonce)

@router.post("/verify", response_model=TokenResponse)
async def verify(request: Request):
    if not settings.jwt_secret:
        # Misconfiguration on server – do not proceed
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="JWT secret not configured")
    
    try:
        # Handle both JSON and form-encoded requests for backward compatibility
        content_type = request.headers.get("content-type", "")
        
        if "application/json" in content_type:
            # JSON request
            body = await request.json()
            address = body.get("address")
            signature = body.get("signature")
        elif "application/x-www-form-urlencoded" in content_type:
            # Form-encoded request (legacy support)
            form_data = await request.form()
            address = form_data.get("address")
            signature = form_data.get("signature")
        else:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported content type")
        
        if not address or not signature:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing address or signature")
        
        # Validate address format
        if not Web3.is_address(address):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid address format")
        
        token = verify_and_issue_token(address, signature, settings.jwt_secret)
        return TokenResponse(token=token)
        
    except ValueError as e:
        # Signature/nonce problems => unauthorized
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Any other parse/validation error => bad request
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Verification failed: {str(e)}")
