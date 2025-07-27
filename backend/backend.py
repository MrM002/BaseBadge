# backend/backend.py

from fastapi import FastAPI
from backend.api.routes import router

app = FastAPI(
    title="BaseBadge API",
    description="Your Wallet, Your Reputation – Onchain & Beyond",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

app.include_router(router)

@app.get("/ping")
def ping():
    return {"msg": "pong"}

@app.get("/")
def root():
    return {
        "message": "Welcome to BaseBadge API",
        "version": "0.1.0",
        "docs": "/docs",
        "health": "/ping"
    }

def main():
    """Main function for running the application."""
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

if __name__ == "__main__":
    main()
