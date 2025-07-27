from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse
from backend.services.scorer import calculate_score
from backend.utils.wallet import get_wallet_data

router = APIRouter()

@router.get("/score/{address}")
def score_endpoint(
    address: str,
    details: bool = Query(True, alias="details")
):
    result = calculate_score(address, include_details=details)
    return JSONResponse(content=result.model_dump(exclude_none=True))

@router.get("/wallet/{address}")
def wallet_endpoint(address: str):
    data = get_wallet_data(address)
    return JSONResponse(content=data)