"""
SkyInsight NLP API (FastAPI)
Backend for the Next.js dashboard.

Endpoints:
    GET  /                  -> health
    GET  /stats             -> high-level KPIs
    GET  /distributions     -> sentiment + topic histograms
    GET  /topics            -> LDA topics
    GET  /entities          -> top named entities
    GET  /reviews           -> paginated reviews (filters: sentiment, topic, q)
    POST /sentiment         -> live VADER + DistilBERT analysis

Run:
    uvicorn 10_NLP.app.api:app --reload --port 8000
"""

from __future__ import annotations

from pathlib import Path
import json
import traceback
from functools import lru_cache
from typing import Optional

import pandas as pd
from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

OUTPUT_DIR = Path(__file__).resolve().parent.parent / "outputs_nlp"

app = FastAPI(title="SkyInsight NLP API", version="2.0")


@app.exception_handler(Exception)
async def _unhandled(request: Request, exc: Exception):
    """Return the real traceback as JSON instead of a plain 500."""
    return JSONResponse(
        status_code=500,
        content={"detail": traceback.format_exc()},
    )


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Cached loaders ────────────────────────────────────────────────────────────
@lru_cache(maxsize=1)
def _load_reviews() -> pd.DataFrame:
    path = OUTPUT_DIR / "airline_reviews_cleaned.csv"
    if not path.exists():
        raise HTTPException(status_code=404, detail=f"reviews file not found: {path}")
    df = pd.read_csv(path, encoding="utf-8", encoding_errors="ignore")
    for c in ["sent_vader_label", "sent_bert_label", "topic_id", "text_clean", "entities", "sent_vader"]:
        if c not in df.columns:
            df[c] = None
    return df


@lru_cache(maxsize=1)
def _load_topics() -> pd.DataFrame:
    path = OUTPUT_DIR / "lda_topics.csv"
    if not path.exists():
        raise HTTPException(status_code=404, detail="topics file not found")
    return pd.read_csv(path)


@lru_cache(maxsize=1)
def _load_summary() -> dict:
    path = OUTPUT_DIR / "nlp_export_summary.json"
    if not path.exists():
        raise HTTPException(status_code=404, detail="summary not found")
    with open(path, encoding="utf-8") as f:
        return json.load(f)


@lru_cache(maxsize=1)
def _load_top_entities() -> pd.DataFrame:
    path = OUTPUT_DIR / "top_entities.csv"
    if not path.exists():
        return pd.DataFrame(columns=["entity", "count", "text", "label"])
    return pd.read_csv(path)


_sia = None
_bert = None
_models_error: str | None = None


def _ensure_models():
    global _sia, _bert, _models_error
    if _models_error:
        raise HTTPException(status_code=500, detail=f"Model load failed:\n{_models_error}")
    if _sia is None or _bert is None:
        try:
            import nltk
            nltk.download("vader_lexicon", quiet=True)
            from nltk.sentiment import SentimentIntensityAnalyzer
            from transformers import pipeline
            _sia = SentimentIntensityAnalyzer()
            _bert = pipeline(
                "sentiment-analysis",
                model="distilbert-base-uncased-finetuned-sst-2-english",
                truncation=True,
                max_length=512,
            )
        except Exception:
            _models_error = traceback.format_exc()
            raise HTTPException(status_code=500, detail=f"Model load failed:\n{_models_error}")


class SentimentIn(BaseModel):
    text: str


@app.get("/")
def health():
    return {"status": "ok", "service": "SkyInsight NLP API", "version": "2.0"}


@app.get("/debug")
def debug():
    """Attempt to load models and return detailed status. Use to diagnose 500s."""
    import sys
    result = {"python": sys.executable, "python_version": sys.version, "modules": {}}
    for mod in ["nltk", "transformers", "torch", "pandas", "spacy"]:
        try:
            m = __import__(mod)
            result["modules"][mod] = getattr(m, "__version__", "ok")
        except ImportError as e:
            result["modules"][mod] = f"MISSING: {e}"
    try:
        _ensure_models()
        result["models"] = "loaded"
    except Exception:
        result["models"] = traceback.format_exc()
    return result


@app.get("/stats")
def stats():
    df = _load_reviews()
    try:
        summary = _load_summary()
    except HTTPException:
        summary = {}
    vader_counts = df["sent_vader_label"].value_counts(dropna=True).to_dict()
    bert_counts = df["sent_bert_label"].value_counts(dropna=True).to_dict()
    n = max(len(df), 1)
    positive_pct = 100 * (df["sent_vader_label"] == "positive").sum() / n
    negative_pct = 100 * (df["sent_vader_label"] == "negative").sum() / n
    return {
        "total_reviews": int(len(df)),
        "positive_pct": round(float(positive_pct), 2),
        "negative_pct": round(float(negative_pct), 2),
        "n_topics": int(df["topic_id"].nunique(dropna=True)),
        "vader_counts": {str(k): int(v) for k, v in vader_counts.items()},
        "bert_counts": {str(k): int(v) for k, v in bert_counts.items()},
        "summary": summary,
    }


@app.get("/distributions")
def distributions():
    df = _load_reviews()
    vader = (
        df["sent_vader_label"].value_counts(dropna=True)
        .rename_axis("label").reset_index(name="count")
        .to_dict(orient="records")
    )
    bert = (
        df["sent_bert_label"].value_counts(dropna=True)
        .rename_axis("label").reset_index(name="count")
        .to_dict(orient="records")
    )
    topics = (
        df["topic_id"].value_counts(dropna=True).sort_index()
        .rename_axis("topic_id").reset_index(name="count")
        .to_dict(orient="records")
    )
    hist = []
    s = pd.to_numeric(df["sent_vader"], errors="coerce").dropna()
    if not s.empty:
        binned = pd.cut(s, bins=30).value_counts().sort_index()
        for interval, c in binned.items():
            hist.append({
                "bin": f"{interval.left:.2f}",
                "left": float(interval.left),
                "right": float(interval.right),
                "count": int(c),
            })
    return {"vader": vader, "bert": bert, "topics": topics, "vader_histogram": hist}


@app.get("/topics")
def topics():
    return _load_topics().to_dict(orient="records")


@app.get("/entities")
def entities(limit: int = Query(30, ge=1, le=200), label: Optional[str] = None):
    df = _load_top_entities()
    if label:
        df = df[df["label"].astype(str).str.upper() == label.upper()]
    return df.head(limit).to_dict(orient="records")


@app.get("/reviews")
def reviews(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=200),
    sentiment: Optional[str] = None,
    topic: Optional[int] = None,
    q: Optional[str] = None,
):
    df = _load_reviews()
    if sentiment:
        df = df[df["sent_vader_label"].astype(str).str.lower() == sentiment.lower()]
    if topic is not None:
        df = df[df["topic_id"] == topic]
    if q:
        df = df[df["text_clean"].astype(str).str.contains(q, case=False, na=False)]

    total = int(len(df))
    start = (page - 1) * page_size
    end = start + page_size
    cols = [c for c in [
        "text_clean", "sent_vader_label", "sent_vader",
        "sent_bert_label", "sent_bert_score", "topic_id", "entities",
    ] if c in df.columns]
    items = df.iloc[start:end][cols].fillna("").to_dict(orient="records")
    return {"total": total, "page": page, "page_size": page_size, "items": items}


@app.post("/sentiment")
def sentiment(payload: SentimentIn):
    text = (payload.text or "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="text is required")
    _ensure_models()

    vader = _sia.polarity_scores(text)
    comp = vader["compound"]
    vader_label = "positive" if comp > 0.05 else "negative" if comp < -0.05 else "neutral"

    bert_out = _bert(text)[0]

    return {
        "text": text,
        "vader": {"label": vader_label, **{k: float(v) for k, v in vader.items()}},
        "distilbert": {"label": bert_out["label"], "score": float(bert_out["score"])},
    }
