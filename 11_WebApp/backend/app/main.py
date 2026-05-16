"""FastAPI entrypoint for SkyInsight web app."""
from __future__ import annotations

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from .inference import predict_cnn, predict_delay, predict_satisfaction
from .reports import get_cluster_analysis, get_co2_forecast, get_high_risk_customers, get_summary
from .schemas import DelayRequest, SatisfactionRequest

app = FastAPI(title="SkyInsight API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=False,
)


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/api/reports/summary")
def reports_summary() -> dict:
    return get_summary()


@app.get("/api/reports/co2-forecast")
def reports_co2() -> dict:
    return get_co2_forecast()


@app.get("/api/reports/high-risk-customers")
def reports_high_risk() -> dict:
    return get_high_risk_customers()


@app.get("/api/reports/cluster-analysis")
def reports_cluster() -> dict:
    return get_cluster_analysis()


@app.post("/api/predict/satisfaction")
def post_satisfaction(req: SatisfactionRequest) -> dict:
    payload = req.model_dump(by_alias=True)
    try:
        return predict_satisfaction(payload)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/api/predict/delay")
def post_delay(req: DelayRequest) -> dict:
    try:
        return predict_delay(req.model_dump())
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/api/predict/cnn/{task}")
async def post_cnn(task: str, file: UploadFile = File(...)) -> dict:
    if task not in {"cabin", "crowd", "luggage"}:
        raise HTTPException(status_code=404, detail=f"Unknown task: {task}")
    data = await file.read()
    try:
        return predict_cnn(task, data)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
