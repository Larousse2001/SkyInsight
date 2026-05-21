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
    for c in ["sent_vader_label", "sent_bert_label", "topic_id", "topic_label", "text_clean", "entities", "sent_vader"]:
        if c not in df.columns:
            df[c] = None
    # Backfill topic_label from lda_topics.csv if missing
    if df["topic_label"].isna().all() and df["topic_id"].notna().any():
        try:
            tdf = pd.read_csv(OUTPUT_DIR / "lda_topics.csv")
            if "topic_label" in tdf.columns:
                mapping = dict(zip(tdf["topic_id"].astype(int), tdf["topic_label"].astype(str)))
                df["topic_label"] = df["topic_id"].map(mapping)
        except Exception:
            pass
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
_baseline_vec = None
_baseline_model = None
_models_error: str | None = None
MODELS_DIR = OUTPUT_DIR / "models"


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


def _ensure_baseline():
    """Lazy-load the persisted TF-IDF baseline model (LogReg/NB/SVC + vectorizer)."""
    global _baseline_vec, _baseline_model
    if _baseline_vec is not None and _baseline_model is not None:
        return
    try:
        import joblib
        vec_p = MODELS_DIR / "baseline_vectorizer.joblib"
        mdl_p = MODELS_DIR / "baseline_best_model.joblib"
        if not vec_p.exists() or not mdl_p.exists():
            raise FileNotFoundError(
                f"Baseline artifacts not found in {MODELS_DIR}. "
                "Run the notebook (cell 4c) to generate them."
            )
        _baseline_vec = joblib.load(vec_p)
        _baseline_model = joblib.load(mdl_p)
    except Exception:
        # Surface a clean message; keep _baseline_* as None so retry stays possible.
        raise HTTPException(status_code=503, detail=traceback.format_exc())


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
    # Topic distribution — enrich with human-readable label when available
    topic_counts = (
        df["topic_id"].value_counts(dropna=True).sort_index()
        .rename_axis("topic_id").reset_index(name="count")
    )
    try:
        tdf = _load_topics()
        if "topic_label" in tdf.columns:
            topic_counts = topic_counts.merge(
                tdf[["topic_id", "topic_label"]], on="topic_id", how="left"
            )
    except HTTPException:
        pass
    topics = topic_counts.fillna("").to_dict(orient="records")
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


@lru_cache(maxsize=1)
def _load_baseline() -> dict:
    path = OUTPUT_DIR / "baseline_metrics.json"
    if not path.exists():
        return {}
    with open(path, encoding="utf-8") as f:
        return json.load(f)


@app.get("/baseline")
def baseline():
    """Baseline ML benchmark (LogReg + MultinomialNB on TF-IDF, with SMOTE)."""
    data = _load_baseline()
    if not data:
        return {"available": False, "message": "Run the notebook to generate baseline_metrics.json"}
    return {"available": True, **data}


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
        "sent_bert_label", "sent_bert_score", "topic_id", "topic_label", "entities",
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

    # Try the persisted TF-IDF baseline (best of LogReg/NB/SVC) — non-fatal if missing
    baseline_pred = None
    try:
        _ensure_baseline()
        X = _baseline_vec.transform([text])
        pred = _baseline_model.predict(X)[0]
        proba = None
        if hasattr(_baseline_model, "predict_proba"):
            probs = _baseline_model.predict_proba(X)[0]
            classes = list(getattr(_baseline_model, "classes_", []))
            proba = {str(c): float(p) for c, p in zip(classes, probs)}
        baseline_pred = {
            "label": str(pred),
            "model": type(_baseline_model).__name__,
            "proba": proba,
        }
    except HTTPException:
        baseline_pred = None
    except Exception:
        baseline_pred = None

    return {
        "text": text,
        "vader": {"label": vader_label, **{k: float(v) for k, v in vader.items()}},
        "distilbert": {"label": bert_out["label"], "score": float(bert_out["score"])},
        "baseline": baseline_pred,
    }


# ── Aspect-based sentiment (topic × BERT sentiment matrix) ────────────────────
@lru_cache(maxsize=1)
def _load_aspect_sentiment() -> list:
    path = OUTPUT_DIR / "aspect_sentiment.csv"
    if not path.exists():
        return []
    df = pd.read_csv(path)
    return df.to_dict(orient="records")


@app.get("/aspect-sentiment")
def aspect_sentiment():
    """Topic × DistilBERT sentiment matrix for the heatmap view."""
    records = _load_aspect_sentiment()
    if not records:
        return {"available": False, "items": []}
    return {"available": True, "items": records}


# ── Topic time series (rolling negative share per topic per day) ──────────────
@lru_cache(maxsize=1)
def _load_timeseries() -> list:
    path = OUTPUT_DIR / "topic_timeseries.csv"
    if not path.exists():
        return []
    df = pd.read_csv(path)
    return df.to_dict(orient="records")


@app.get("/timeseries")
def timeseries():
    """Per-topic daily review volume + negative share (BERT)."""
    records = _load_timeseries()
    if not records:
        return {"available": False, "items": []}
    return {"available": True, "items": records}


# ── Word cloud / term frequency ───────────────────────────────────────────────
# Generic English + airline-domain stopwords filtered out of the cloud so we
# don't get "flight, airline, plane" dominating every bucket.
_CLOUD_STOPWORDS = {
    "flight", "flights", "airline", "airlines", "plane", "planes", "fly", "flying",
    "trip", "travel", "travelling", "traveling", "airport", "airports", "passenger",
    "passengers", "review", "reviews", "experience", "experiences", "time", "day",
    "days", "hour", "hours", "minute", "minutes", "year", "years", "people", "thing",
    "things", "way", "also", "even", "would", "could", "really", "very", "much",
    "many", "lot", "lots", "ever", "still", "back", "one", "two", "three", "first",
    "second", "next", "last", "another", "go", "going", "got", "get", "getting",
    "make", "made", "say", "said", "tell", "told", "take", "took", "give", "gave",
    "come", "came", "use", "used", "know", "knew", "see", "saw", "look", "looked",
    "want", "wanted", "need", "needed", "ask", "asked", "try", "tried", "feel",
    "felt", "think", "thought", "let", "leave", "left", "put", "find", "found",
}


def _word_counts(texts, top_n: int, min_len: int = 3):
    from collections import Counter
    counter: Counter = Counter()
    for t in texts:
        if not isinstance(t, str):
            continue
        for w in t.lower().split():
            w = w.strip(".,!?;:\"'()[]{}/")
            if len(w) < min_len or not w.isalpha():
                continue
            if w in _CLOUD_STOPWORDS:
                continue
            counter[w] += 1
    return counter.most_common(top_n)


@app.get("/wordcloud")
def wordcloud(
    sentiment: Optional[str] = None,
    topic: Optional[int] = None,
    airline: Optional[str] = None,
    top: int = Query(80, ge=10, le=300),
):
    """Return [{text, value}] suitable for a word-cloud visualisation.

    Filters mirror /reviews so the cloud can react to the same controls.
    Uses ``text_nostop`` (lemmatised + stop-words removed) when present.
    """
    df = _load_reviews()
    if sentiment:
        df = df[df["sent_vader_label"].astype(str).str.lower() == sentiment.lower()]
    if topic is not None:
        df = df[df["topic_id"] == topic]
    if airline:
        df = df[df["airline"].astype(str).str.lower() == airline.lower()]

    col = "text_nostop" if "text_nostop" in df.columns and df["text_nostop"].notna().any() else "text_clean"
    pairs = _word_counts(df[col].dropna().astype(str).tolist(), top_n=top)
    return {
        "available": len(pairs) > 0,
        "n_reviews": int(len(df)),
        "source_column": col,
        "items": [{"text": w, "value": int(c)} for w, c in pairs],
    }


# ── Per-airline sentiment breakdown ───────────────────────────────────────────
@app.get("/airline-stats")
def airline_stats(top: int = Query(12, ge=1, le=50)):
    """Top airlines by review volume with VADER/BERT sentiment split + avg rating."""
    df = _load_reviews()
    if "airline" not in df.columns:
        return {"available": False, "items": []}
    df = df[df["airline"].astype(str).str.strip().ne("")]

    counts = df["airline"].value_counts().head(top)
    items = []
    for name, n in counts.items():
        sub = df[df["airline"] == name]
        vader_counts = sub["sent_vader_label"].astype(str).str.lower().value_counts().to_dict()
        bert_counts = sub["sent_bert_label"].astype(str).str.upper().value_counts().to_dict()
        try:
            avg_rating = float(sub["rating_norm"].dropna().astype(float).mean())
        except Exception:
            avg_rating = None
        items.append({
            "airline": str(name),
            "count": int(n),
            "avg_rating": None if avg_rating is None or pd.isna(avg_rating) else round(avg_rating, 2),
            "vader_positive": int(vader_counts.get("positive", 0)),
            "vader_neutral": int(vader_counts.get("neutral", 0)),
            "vader_negative": int(vader_counts.get("negative", 0)),
            "bert_positive": int(bert_counts.get("POSITIVE", 0)),
            "bert_negative": int(bert_counts.get("NEGATIVE", 0)),
        })
    return {"available": True, "items": items}


# ── Rating distribution (normalised 1–5 scale) ────────────────────────────────
@app.get("/rating-distribution")
def rating_distribution():
    df = _load_reviews()
    if "rating_norm" not in df.columns:
        return {"available": False, "items": []}
    s = pd.to_numeric(df["rating_norm"], errors="coerce").dropna()
    if s.empty:
        return {"available": False, "items": []}
    # 5 buckets aligned with star ratings: [≤1, (1,2], (2,3], (3,4], (4,5]]
    buckets = [
        ("1 ★", 0.0, 1.5),
        ("2 ★", 1.5, 2.5),
        ("3 ★", 2.5, 3.5),
        ("4 ★", 3.5, 4.5),
        ("5 ★", 4.5, 5.01),
    ]
    items = [
        {"label": lbl, "count": int(((s >= lo) & (s < hi)).sum())}
        for (lbl, lo, hi) in buckets
    ]
    return {
        "available": True,
        "mean": round(float(s.mean()), 2),
        "median": round(float(s.median()), 2),
        "items": items,
    }


# ── Review length distribution (in words) ─────────────────────────────────────
@app.get("/length-distribution")
def length_distribution():
    df = _load_reviews()
    if "word_len" not in df.columns:
        return {"available": False, "items": []}
    s = pd.to_numeric(df["word_len"], errors="coerce").dropna()
    if s.empty:
        return {"available": False, "items": []}
    bins = [(0, 25), (25, 50), (50, 100), (100, 200), (200, 10_000)]
    labels = ["≤25", "26-50", "51-100", "101-200", "200+"]
    items = []
    for (lo, hi), lbl in zip(bins, labels):
        items.append({"label": lbl, "count": int(((s >= lo) & (s < hi)).sum())})
    return {
        "available": True,
        "mean": round(float(s.mean()), 1),
        "median": round(float(s.median()), 1),
        "items": items,
    }
