"""
Phase 4 - FastAPI Backend
REST endpoints exposing the NLP models for programmatic access.

Endpoints:
    GET  /            -> health
    POST /sentiment   -> {"text": "..."} -> VADER + DistilBERT scores
    GET  /topics      -> LDA topics list
    GET  /summary     -> pipeline summary

Run:
    uvicorn 10_NLP.app.api:app --reload --port 8000
"""

from pathlib import Path
import json

import pandas as pd
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

OUTPUT_DIR = Path(__file__).resolve().parent.parent / "outputs_nlp"

app = FastAPI(title="SkyInsight NLP API", version="1.0")

# Lazy globals
_sia = None
_bert = None
_topics_df = None
_summary = None


def _ensure_models():
    global _sia, _bert
    if _sia is None or _bert is None:
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


class SentimentIn(BaseModel):
    text: str


@app.get("/")
def health():
    return {"status": "ok", "service": "SkyInsight NLP API"}


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
        "vader": {"label": vader_label, **vader},
        "distilbert": {"label": bert_out["label"], "score": float(bert_out["score"])},
    }


@app.get("/topics")
def topics():
    global _topics_df
    if _topics_df is None:
        path = OUTPUT_DIR / "lda_topics.csv"
        if not path.exists():
            raise HTTPException(status_code=404, detail="topics file not found")
        _topics_df = pd.read_csv(path)
    return _topics_df.to_dict(orient="records")


@app.get("/summary")
def summary():
    global _summary
    if _summary is None:
        path = OUTPUT_DIR / "nlp_export_summary.json"
        if not path.exists():
            raise HTTPException(status_code=404, detail="summary not found")
        with open(path, encoding="utf-8") as f:
            _summary = json.load(f)
    return _summary
