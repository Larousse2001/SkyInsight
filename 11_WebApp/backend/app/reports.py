"""Static report data aggregation."""
from __future__ import annotations

import json
from pathlib import Path

import pandas as pd

from .config import REPORTS_DIR


def _safe_json(p: Path) -> dict | None:
    try:
        return json.loads(p.read_text(encoding="utf-8"))
    except Exception:
        return None


def get_summary() -> dict:
    sat = _safe_json(REPORTS_DIR / "[ML] Airline Customer Satisfaction" / "model_metadata.json") or {}
    route = _safe_json(REPORTS_DIR / "[ML] Airline Route Profitability & Cost Analysis" / "best_models_summary.json") or {}
    co2 = _safe_json(REPORTS_DIR / "[ML] CO² Emissions by Planes" / "best_model_naive_lag1.json") or {}

    return {
        "projects": [
            {
                "id": "churn",
                "title": "Customer Churn Prediction",
                "category": "Machine Learning",
                "tagline": "Identify top-risk customers before they leave.",
                "metric": {"label": "High-risk flagged (top-20)", "value": "20"},
                "icon": "users",
            },
            {
                "id": "satisfaction",
                "title": "Customer Satisfaction",
                "category": "Machine Learning",
                "tagline": "XGBoost classifier on flight experience.",
                "metric": {"label": "Accuracy", "value": f"{sat.get('metrics', {}).get('accuracy', 0) * 100:.1f}%"},
                "icon": "smile",
            },
            {
                "id": "route",
                "title": "Route Profitability",
                "category": "Machine Learning",
                "tagline": "Margin & class drivers per route.",
                "metric": {
                    "label": "Reg R² / Cls AUC",
                    "value": (
                        f"{route.get('best_regression_model', {}).get('Test R²', 0):.2f}"
                        f" / {route.get('best_classification_model', {}).get('ROC-AUC', 0):.2f}"
                    ),
                },
                "icon": "trending-up",
            },
            {
                "id": "co2",
                "title": "CO₂ Emissions Forecast",
                "category": "Time Series",
                "tagline": "Naive-Lag1 baseline vs ML models.",
                "metric": {"label": "Last value (t)", "value": f"{co2.get('last_value', 0):,.0f}"},
                "icon": "leaf",
            },
            {
                "id": "delay",
                "title": "Flight Delay Predictor",
                "category": "Deep Learning (ANN)",
                "tagline": "DNN trained on US BTS delay causes.",
                "metric": {"label": "Architecture", "value": "DNN (Keras)"},
                "icon": "clock",
            },
            {
                "id": "cnn",
                "title": "Cabin / Crowd / Luggage CV",
                "category": "Deep Learning (CNN)",
                "tagline": "EfficientNetV2S with TTA + temperature scaling.",
                "metric": {"label": "Tasks", "value": "3 classifiers"},
                "icon": "camera",
            },
        ],
        "satisfaction_metrics": sat.get("metrics", {}),
        "route_models": {
            "regression": route.get("best_regression_model", {}),
            "classification": route.get("best_classification_model", {}),
            "shap": route.get("top_shap_features", {}),
        },
        "co2": co2,
    }


def get_co2_forecast() -> dict:
    csv = REPORTS_DIR / "[ML] CO² Emissions by Planes" / "forecast_values.csv"
    if not csv.exists():
        return {"rows": []}
    df = pd.read_csv(csv)
    return {
        "columns": df.columns.tolist(),
        "rows": df.to_dict(orient="records"),
    }


def get_high_risk_customers() -> dict:
    csv = REPORTS_DIR / "[ML] Airline Customer Churn Prediction" / "high_risk_customers_top20.csv"
    if not csv.exists():
        return {"rows": []}
    df = pd.read_csv(csv).head(20)
    return {
        "columns": df.columns.tolist(),
        "rows": df.to_dict(orient="records"),
    }
