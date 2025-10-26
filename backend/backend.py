# backend/backend.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.api.routes import router as api_router
from backend.core.config import settings
from backend.auth.routes import router as auth_router
from backend.bff.routes import router as bff_router
import json

# Validate critical configuration at startup
if not settings.jwt_secret:
    raise RuntimeError("JWT_SECRET must be configured in environment variables")

app = FastAPI()

# Add CORS middleware
# Resolve allowed CORS origins from settings (env BACKEND_CORS_ORIGINS)
origins = settings.backend_cors_origins
if isinstance(origins, str):
    try:
        origins = json.loads(origins)  # ["https://basebadge.com", ...]
    except Exception:
        origins = [o.strip() for o in origins.split(",") if o.strip()]
if not origins:
    origins = ["*"]

allow_credentials = False if ("*" in origins) else True

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    # allow_origin_regex=".*",
    allow_credentials=allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(api_router)
app.include_router(bff_router)

# Basic health endpoint for container/orchestrator checks
@app.get("/health")
def health():
    return {"status": "ok"}