from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import analytics, drawings

app = FastAPI(
    title="Lotto Analytics API",
    description="Statistical analysis platform for Brazilian lotteries.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["GET"],
    allow_headers=["*"],
)

app.include_router(drawings.router)
app.include_router(analytics.router)


@app.get("/health")
def health():
    return {"status": "ok"}
