# SkyInsight Backend API

FastAPI service exposing ONNX models from `09_Reports/` for the web app frontend.

## Install

```powershell
cd 11_WebApp/backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

## Run

```powershell
uvicorn app.main:app --reload --port 8000
```

Docs at http://localhost:8000/docs

## Endpoints

| Method | Path                                | Description                          |
|--------|-------------------------------------|--------------------------------------|
| GET    | /api/health                         | Liveness                             |
| GET    | /api/reports/summary                | Aggregated metrics for all projects  |
| GET    | /api/reports/co2-forecast           | Multi-model CO₂ forecast rows        |
| GET    | /api/reports/high-risk-customers    | Top-20 churn-risk customers          |
| POST   | /api/predict/satisfaction           | Customer satisfaction (XGBoost)      |
| POST   | /api/predict/delay                  | Flight delay (DNN)                   |
| POST   | /api/predict/cnn/{cabin\|crowd\|luggage} | Image classification           |
