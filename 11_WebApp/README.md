# SkyInsight Web App

Modern full-stack showcase for every model exported under `09_Reports/`.

**Stack:** Next.js 15 (App Router, TypeScript, Tailwind CSS, Recharts) on the
front, FastAPI + ONNX Runtime on the back. Lazy-loads ONNX models directly from
`09_Reports/` so the web app is always in sync with the latest training run.

```
11_WebApp/
├── backend/          # FastAPI + onnxruntime
│   ├── app/
│   │   ├── main.py        # routes
│   │   ├── inference.py   # ONNX wrappers
│   │   ├── reports.py     # summary aggregation
│   │   ├── models.py      # session registry
│   │   ├── schemas.py     # pydantic
│   │   └── config.py      # paths / feature order
│   └── requirements.txt
└── frontend/         # Next.js 15
    ├── app/
    │   ├── page.tsx                # landing
    │   ├── dashboard/page.tsx      # executive view
    │   ├── predict/satisfaction/   # XGBoost live inference
    │   ├── predict/delay/          # DNN live inference
    │   ├── predict/cnn/            # image classifier
    │   └── forecast/co2/           # multi-model chart
    └── package.json
```

## 1 · Run the backend

```powershell
cd 11_WebApp/backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Open http://localhost:8000/docs for Swagger.

## 2 · Run the frontend

```powershell
cd 11_WebApp/frontend
npm install
npm run dev
```

Open http://localhost:3000. The Next.js dev server proxies `/api/*` to
`localhost:8000`, so you can deploy either piece independently.

## Endpoints used

| UI page                        | Backend call                              | Model artifact                                              |
|--------------------------------|-------------------------------------------|-------------------------------------------------------------|
| `/dashboard`                   | `GET /api/reports/summary`                | `model_metadata.json`, `best_models_summary.json`, …        |
| `/dashboard` (table)           | `GET /api/reports/high-risk-customers`    | `high_risk_customers_top20.csv`                             |
| `/forecast/co2`                | `GET /api/reports/co2-forecast`           | `forecast_values.csv` + `best_model_naive_lag1.json`        |
| `/predict/satisfaction`        | `POST /api/predict/satisfaction`          | `best_satisfaction_model.onnx`                              |
| `/predict/delay`               | `POST /api/predict/delay`                 | `best_skyinsight_model.onnx`                                |
| `/predict/cnn` (cabin/crowd/luggage) | `POST /api/predict/cnn/{task}`      | `cabin_cleanliness_best.onnx`, `crowd_best.onnx`, `luggage_best.onnx` |

## Notes & limitations

- The satisfaction form rebuilds the 30-d one-hot vector exactly as the training
  pipeline (`num__*` and `cat__*` columns); ordering matches
  `outputs_satisfaction/onnx_feature_order.csv`.
- The delay model expects scaled inputs in production; the form sends raw
  values, so live predictions are best treated as **directional** unless the
  fitted scaler is re-exported with the model.
- CNN models assume 224×224 RGB, NHWC, raw `[0, 255]` floats (EfficientNetV2
  applications include rescaling internally). Adjust `inference.py` if a model
  is re-exported with different preprocessing.
- Route Profitability and Churn rely on pre-engineered features; both are
  exposed read-only on `/dashboard` (no interactive form) — wire up a CSV
  upload endpoint if you need batch scoring.
