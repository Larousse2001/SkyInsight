"""
Phase 4 - Streamlit Web Application
Airline Reviews Sentiment & Theme Explorer

Loads the artifacts produced by airline_reviews_nlp_pipeline.ipynb and
exposes:
    - Real-time sentiment analysis (VADER + DistilBERT)
    - Topic / theme exploration (LDA)
    - Interactive trend visualizations (Plotly)
    - Named entity browser

Run:
    streamlit run 10_NLP/app/streamlit_app.py
"""

from pathlib import Path
import json

import numpy as np
import pandas as pd
import plotly.express as px
import streamlit as st

# -----------------------------------------------------------------------------
# Page setup
# -----------------------------------------------------------------------------
st.set_page_config(
    page_title="SkyInsight | Airline Reviews NLP",
    page_icon="✈️",
    layout="wide",
)

OUTPUT_DIR = Path(__file__).resolve().parent.parent / "outputs_nlp"
CLEANED_CSV = OUTPUT_DIR / "airline_reviews_cleaned.csv"
TOPICS_CSV = OUTPUT_DIR / "lda_topics.csv"
NER_CSV = OUTPUT_DIR / "top_entities.csv"
SUMMARY_JSON = OUTPUT_DIR / "nlp_export_summary.json"


# -----------------------------------------------------------------------------
# Cached loaders
# -----------------------------------------------------------------------------
@st.cache_data(show_spinner=False)
def load_dataframe() -> pd.DataFrame:
    if not CLEANED_CSV.exists():
        return pd.DataFrame()
    df = pd.read_csv(CLEANED_CSV)
    if "date" in df.columns:
        df["date"] = pd.to_datetime(df["date"], errors="coerce")
    return df


@st.cache_data(show_spinner=False)
def load_topics() -> pd.DataFrame:
    if not TOPICS_CSV.exists():
        return pd.DataFrame()
    return pd.read_csv(TOPICS_CSV)


@st.cache_data(show_spinner=False)
def load_entities() -> pd.DataFrame:
    if not NER_CSV.exists():
        return pd.DataFrame()
    return pd.read_csv(NER_CSV)


@st.cache_data(show_spinner=False)
def load_summary() -> dict:
    if not SUMMARY_JSON.exists():
        return {}
    with open(SUMMARY_JSON, encoding="utf-8") as f:
        return json.load(f)


@st.cache_resource(show_spinner="Loading sentiment models...")
def load_sentiment_models():
    """Load VADER + DistilBERT once and reuse across requests."""
    import nltk

    nltk.download("vader_lexicon", quiet=True)
    from nltk.sentiment import SentimentIntensityAnalyzer
    from transformers import pipeline

    sia = SentimentIntensityAnalyzer()
    bert = pipeline(
        "sentiment-analysis",
        model="distilbert-base-uncased-finetuned-sst-2-english",
        truncation=True,
        max_length=512,
    )
    return sia, bert


# -----------------------------------------------------------------------------
# Sidebar navigation
# -----------------------------------------------------------------------------
st.sidebar.title("✈️ SkyInsight NLP")
page = st.sidebar.radio(
    "Navigation",
    [
        "Overview",
        "Real-Time Analysis",
        "Sentiment Trends",
        "Topics (LDA)",
        "Named Entities",
        "Browse Reviews",
    ],
)

df = load_dataframe()
topics_df = load_topics()
entities_df = load_entities()
summary = load_summary()

if df.empty:
    st.error(
        "No cleaned dataset found. Run the notebook "
        "`airline_reviews_nlp_pipeline.ipynb` first to generate "
        "`outputs_nlp/airline_reviews_cleaned.csv`."
    )
    st.stop()


# -----------------------------------------------------------------------------
# Pages
# -----------------------------------------------------------------------------
def page_overview():
    st.title("Airline Reviews NLP Dashboard")
    st.caption(
        "Phase 4 deliverable — interactive web app over the NLP pipeline outputs."
    )

    c1, c2, c3, c4 = st.columns(4)
    c1.metric("Total reviews", f"{len(df):,}")
    if "airline" in df.columns:
        c2.metric("Airlines", df["airline"].nunique())
    if "source" in df.columns:
        c3.metric("Sources", df["source"].nunique())
    c4.metric("Topics", int(df["topic_id"].nunique()) if "topic_id" in df else 0)

    st.markdown("### Sentiment distributions")
    col_a, col_b = st.columns(2)

    if "sent_vader_label" in df.columns:
        v = df["sent_vader_label"].value_counts().reset_index()
        v.columns = ["label", "count"]
        fig = px.bar(
            v, x="label", y="count", color="label",
            color_discrete_map={"positive": "#5cb85c", "neutral": "#f0ad4e", "negative": "#d9534f"},
            title="VADER",
        )
        col_a.plotly_chart(fig, use_container_width=True)

    if "sent_bert_label" in df.columns:
        b = df["sent_bert_label"].value_counts().reset_index()
        b.columns = ["label", "count"]
        fig = px.bar(
            b, x="label", y="count", color="label",
            color_discrete_map={"POSITIVE": "#5cb85c", "NEGATIVE": "#d9534f"},
            title="DistilBERT",
        )
        col_b.plotly_chart(fig, use_container_width=True)

    if summary:
        with st.expander("Pipeline summary (nlp_export_summary.json)"):
            st.json(summary)


def page_realtime():
    st.title("Real-Time Sentiment Analysis")
    st.caption("Type or paste a review — VADER and DistilBERT classify it instantly.")

    sia, bert = load_sentiment_models()

    text = st.text_area(
        "Review text",
        value="The flight was delayed for 4 hours and the staff was very rude.",
        height=140,
    )

    if st.button("Analyze", type="primary"):
        if not text.strip():
            st.warning("Please enter some text.")
            return

        col1, col2 = st.columns(2)
        with col1:
            scores = sia.polarity_scores(text)
            comp = scores["compound"]
            label = "positive" if comp > 0.05 else "negative" if comp < -0.05 else "neutral"
            st.subheader("VADER")
            st.metric("Compound", f"{comp:+.3f}")
            st.write({"label": label, **scores})

        with col2:
            out = bert(text)[0]
            st.subheader("DistilBERT (SST-2)")
            color = "🟢" if out["label"] == "POSITIVE" else "🔴"
            st.metric(f"{color} {out['label']}", f"{out['score']*100:.1f}%")


def page_trends():
    st.title("Sentiment Trends")

    cols = st.columns(2)
    airline = "All"
    source = "All"
    if "airline" in df.columns:
        airline = cols[0].selectbox(
            "Airline", ["All"] + sorted(df["airline"].dropna().unique().tolist())
        )
    if "source" in df.columns:
        source = cols[1].selectbox(
            "Source", ["All"] + sorted(df["source"].dropna().unique().tolist())
        )

    sub = df.copy()
    if airline != "All" and "airline" in sub.columns:
        sub = sub[sub["airline"] == airline]
    if source != "All" and "source" in sub.columns:
        sub = sub[sub["source"] == source]

    st.write(f"Filtered reviews: **{len(sub):,}**")

    if "sent_vader" in sub.columns:
        fig = px.histogram(
            sub, x="sent_vader", nbins=30,
            title="VADER Compound Score Distribution",
            color_discrete_sequence=["#5bc0de"],
        )
        st.plotly_chart(fig, use_container_width=True)

    if "date" in sub.columns and sub["date"].notna().any():
        ts = (
            sub.dropna(subset=["date"])
               .assign(month=lambda d: d["date"].dt.to_period("M").dt.to_timestamp())
               .groupby("month")["sent_vader"].mean()
               .reset_index()
        )
        fig = px.line(
            ts, x="month", y="sent_vader",
            title="Average VADER Sentiment Over Time", markers=True,
        )
        st.plotly_chart(fig, use_container_width=True)

    if "airline" in sub.columns and "sent_vader" in sub.columns:
        agg = (
            sub.groupby("airline")["sent_vader"].mean()
               .sort_values().reset_index()
        )
        fig = px.bar(
            agg, x="sent_vader", y="airline", orientation="h",
            title="Mean VADER Sentiment by Airline",
            color="sent_vader", color_continuous_scale="RdYlGn",
        )
        st.plotly_chart(fig, use_container_width=True)


def page_topics():
    st.title("LDA Topics")

    if topics_df.empty:
        st.warning("No topics file found.")
        return

    st.dataframe(topics_df, use_container_width=True)

    if "topic_id" in df.columns:
        counts = df["topic_id"].value_counts().sort_index().reset_index()
        counts.columns = ["topic_id", "count"]
        merged = counts.merge(topics_df, on="topic_id", how="left")
        fig = px.bar(
            merged, x="topic_id", y="count",
            hover_data=["top_terms"],
            title="Reviews per Topic",
            color="count", color_continuous_scale="Blues",
        )
        st.plotly_chart(fig, use_container_width=True)

        chosen = st.selectbox("Show example reviews for topic", merged["topic_id"])
        sample = df[df["topic_id"] == chosen].head(5)
        for _, row in sample.iterrows():
            st.markdown(f"> {str(row.get('text_clean', ''))[:400]}")


def page_entities():
    st.title("Named Entities")

    if entities_df.empty:
        st.warning("No entities file found.")
        return

    label_filter = st.multiselect(
        "Filter by entity label",
        sorted(entities_df["label"].dropna().unique().tolist()),
    )
    view = entities_df.copy()
    if label_filter:
        view = view[view["label"].isin(label_filter)]

    st.dataframe(view, use_container_width=True)

    fig = px.bar(
        view.head(25), x="count", y="text", orientation="h", color="label",
        title="Top Entities",
    )
    fig.update_yaxes(categoryorder="total ascending")
    st.plotly_chart(fig, use_container_width=True)


def page_browse():
    st.title("Browse Reviews")

    cols = st.columns(3)
    airlines = ["All"] + (
        sorted(df["airline"].dropna().unique().tolist()) if "airline" in df.columns else []
    )
    airline = cols[0].selectbox("Airline", airlines)

    sentiments = ["All", "positive", "neutral", "negative"]
    sentiment = cols[1].selectbox("VADER sentiment", sentiments)

    keyword = cols[2].text_input("Contains keyword")

    sub = df.copy()
    if airline != "All" and "airline" in sub.columns:
        sub = sub[sub["airline"] == airline]
    if sentiment != "All" and "sent_vader_label" in sub.columns:
        sub = sub[sub["sent_vader_label"] == sentiment]
    if keyword:
        sub = sub[sub["text_clean"].str.contains(keyword.lower(), na=False)]

    show_cols = [
        c for c in ["airline", "source", "date", "sent_vader_label",
                    "sent_bert_label", "topic_id", "text_clean"]
        if c in sub.columns
    ]
    st.write(f"Matched reviews: **{len(sub):,}**")
    st.dataframe(sub[show_cols].head(500), use_container_width=True)


# -----------------------------------------------------------------------------
# Router
# -----------------------------------------------------------------------------
PAGES = {
    "Overview": page_overview,
    "Real-Time Analysis": page_realtime,
    "Sentiment Trends": page_trends,
    "Topics (LDA)": page_topics,
    "Named Entities": page_entities,
    "Browse Reviews": page_browse,
}
PAGES[page]()
