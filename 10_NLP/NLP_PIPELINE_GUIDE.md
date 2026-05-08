# Airline Reviews NLP Pipeline — Step-by-Step Documentation

This document explains every cell of `airline_reviews_nlp_pipeline.ipynb` and how it
maps to the 5-phase plan from the *Catalogue Projets NLP — Projet 1* brief
(Sentiment analysis to improve customer experience).

| Phase | Brief description                                  | Notebook / Code                                  |
|-------|----------------------------------------------------|--------------------------------------------------|
| 1     | Data collection                                    | `scraper_airline_reviews.py`, `scraper_airline_reviews_web.py`, cells 4–5 |
| 2     | Cleaning, tokenization, vectorization              | Cells 6–7                                        |
| 3     | NLP analysis (VADER, DistilBERT, LDA, NER)         | Cells 8–10                                       |
| 4     | Web application (Backend + Frontend)               | `10_NLP/app/streamlit_app.py`, `10_NLP/app/api.py` |
| 5     | Validation & deployment                            | Cell 12, this document                           |

---

## Cell 1 — Install Required Libraries

Installs every Python package the pipeline needs using `pip install --user` so the
notebook works on Windows without admin rights:

- Core: `numpy`, `pandas`, `scikit-learn`, `scipy`
- Visualization: `matplotlib`, `seaborn`, `wordcloud`
- NLP: `nltk`, `spacy`, `transformers`, `torch`
- Scraping: `requests`, `beautifulsoup4`

It also downloads the spaCy English model `en_core_web_sm` (required for NER).
Each install reports `OK` or a one-line `FAILED:` reason — nothing is silent.

## Cell 2 — Imports and Path Configuration

Imports all libraries directly (no `try/except` fallback). NLTK resources
(`stopwords`, `vader_lexicon`, `punkt`) are downloaded quietly. CUDA is detected
to set `DEVICE = 0` (GPU) or `-1` (CPU) for the transformer pipelines.

Paths defined:

- `RAW_PATH` → `airline_reviews_raw_data.csv` (existing dataset)
- `SCRAPED_PATH` → output of the Reddit/PullPush scraper
- `WEB_SCRAPED_PATH` → output of the Skytrax/TripAdvisor/Trustpilot scraper
- `OUTPUT_DIR` → `outputs_nlp/` (all artifacts saved here)

## Cell 3 — Phase 1: Load Three Data Sources

Reads each CSV with `safe_read_csv`, which fails loudly if a file is missing.
Prints the shape and first three rows of each source so you can confirm content
before unioning.

## Cell 4 — Phase 1: Union & Save Combined Dataset

1. Computes the union of all column names across the three sources.
2. Reindexes each frame to the same column set (missing columns become `NaN`).
3. Concatenates them, drops exact duplicates, and saves
   `outputs_nlp/airline_reviews_combined.csv`.
4. Prints per-source row counts and the dedup summary.

**Deliverable for Phase 1:** the unioned raw dataset.

## Cell 5 — Phase 2: Text Cleaning, Dedup, Stopwords

1. Auto-detects the review text column from common candidates
   (`review_text`, `text`, `content`, `body`, `title`, …).
2. `clean_text()` lowercases, strips non-alphanumerics, and collapses whitespace.
3. Drops duplicate cleaned texts (catches near-duplicates the raw concat missed).
4. Removes English stopwords from `nltk.corpus.stopwords`, producing
   `text_nostop` (the field used by TF-IDF and LDA).

Two columns are added to `df_all`:

- `text_clean` — used by sentiment models, embeddings, NER (preserves words).
- `text_nostop` — used by TF-IDF and LDA (no stopwords).

## Cell 6 — Phase 2: TF-IDF + DistilBERT Embeddings

**TF-IDF.** `TfidfVectorizer(max_features=4000, ngram_range=(1, 2))` produces a
sparse matrix saved as `tfidf_matrix.npz`. The vocabulary is exported to
`tfidf_vocab.json` (numpy `int64` indices are converted to plain `int` so JSON
serialization works).

**DistilBERT embeddings.** `distilbert-base-uncased` runs in eval mode (CUDA if
available) over every row in batches of 16, with `max_length=256` truncation.
Mean-pooled hidden states are stacked and saved to `text_embeddings.npy` —
shape `(n_reviews, 768)`. Progress is printed every 25 batches.

**Deliverable for Phase 2:** vectorized data ready for modeling.

## Cell 7 — Phase 3: VADER + DistilBERT Sentiment

**VADER** (lexicon-based, runs on every row):

- `sent_vader` — compound score in `[-1, 1]`.
- `sent_vader_label` — bucketed via `pd.cut` into `negative / neutral / positive`
  using the standard VADER thresholds (`±0.05`).

**DistilBERT-SST2** (fine-tuned classifier, runs on every row):

- `truncation=True, max_length=512` so any review fits the 512-token limit.
- Batches of 32, progress logged every 20 batches.
- Outputs `sent_bert_label` (`POSITIVE`/`NEGATIVE`) and `sent_bert_score`.

Final distributions are printed for both models. Nothing is sampled or skipped.

## Cell 8 — Phase 3: LDA Topic Modeling

`CountVectorizer(max_features=3000, stop_words="english")` builds a document-term
matrix; `LatentDirichletAllocation(n_components=8, random_state=42)` fits 8
topics. For every row we store the most-likely `topic_id`. The top-10 terms per
topic are exported to `lda_topics.csv`.

Interpretation hints — common airline themes typically surface as:
`baggage / luggage`, `delay & cancellation`, `crew & service`, `seat & comfort`,
`food`, `pricing`, `boarding`, `loyalty`. Inspect `lda_topics.csv` to confirm.

## Cell 9 — Phase 3: Named Entity Recognition

`spacy.load("en_core_web_sm", disable=["parser", "tagger", "lemmatizer"])` loads
the lightweight pipeline (NER only, fastest). `nlp.pipe(..., batch_size=64)`
processes **every** review and stores `text:label` pairs in the `entities`
column. The top 50 entities (by count) are aggregated and written to
`top_entities.csv` with separate `text` and `label` fields. Useful labels for
this domain include `ORG` (airlines, airports), `GPE` (countries/cities),
`PERSON`, `MONEY`, `DATE`.

**Deliverable for Phase 3:** validated NLP model with interpretable artifacts
(sentiment columns, topic file, entities file).

## Cell 10 — Phase 2/3: Export Cleaned Data + Summary

Saves:

- `airline_reviews_cleaned.csv` — full enriched dataframe (text, sentiment,
  topic, entities).
- `nlp_export_summary.json` — paths to every artifact + sentiment distributions.

This is the file the web app loads.

## Cell 11 — Phase 5: Visualization & Cross-Model Validation

A 2×2 matplotlib/seaborn figure is rendered and saved as
`outputs_nlp/nlp_overview.png`:

1. VADER label distribution (3 classes).
2. DistilBERT label distribution (2 classes).
3. LDA topic distribution.
4. VADER compound score histogram.

A simple agreement metric is also computed: the percentage of reviews where
VADER (mapped to POS/NEG, neutrals excluded) matches DistilBERT. Useful as a
quick sanity check for Phase 5 validation.

---

## Phase 4 — Web Application

Two complementary apps live in `10_NLP/app/`:

### `streamlit_app.py` (Frontend)

Multi-page Streamlit dashboard with six sections:

1. **Overview** — KPI cards + sentiment distribution charts.
2. **Real-Time Analysis** — paste any review, get VADER + DistilBERT scores
   instantly (models are cached with `st.cache_resource`).
3. **Sentiment Trends** — per-airline / per-source filters, score histograms,
   monthly trend line, mean sentiment by airline (Plotly).
4. **Topics (LDA)** — topic table, reviews-per-topic bar, sample reviews.
5. **Named Entities** — filter by entity label, top-25 horizontal bar chart.
6. **Browse Reviews** — filterable table by airline, sentiment, and keyword.

Run:

```powershell
streamlit run 10_NLP/app/streamlit_app.py
```

### `api.py` (Backend)

FastAPI service exposing the same models programmatically:

| Method | Path         | Body / Query        | Returns                                    |
|--------|--------------|---------------------|--------------------------------------------|
| GET    | `/`          | —                   | health check                               |
| POST   | `/sentiment` | `{"text": "..."}`   | VADER + DistilBERT result                  |
| GET    | `/topics`    | —                   | LDA topics list                            |
| GET    | `/summary`   | —                   | pipeline summary JSON                      |

Run:

```powershell
uvicorn 10_NLP.app.api:app --reload --port 8000
```

`requirements.txt` for both apps lives at `10_NLP/app/requirements.txt`.

---

## Phase 5 — Validation & Deployment

### Local validation

1. Run notebook end-to-end (cells 1 → 11). Cell 11 prints the VADER/DistilBERT
   agreement and saves `nlp_overview.png`.
2. Spot-check `lda_topics.csv` for coherent topics.
3. Spot-check `top_entities.csv` for relevant ORG/GPE entities.

### Deployment

**Streamlit Community Cloud:**

1. Push the repo to GitHub.
2. Create a new app pointing to `10_NLP/app/streamlit_app.py` with the
   requirements file at `10_NLP/app/requirements.txt`.
3. Ensure `outputs_nlp/airline_reviews_cleaned.csv` is committed (or download it
   on first launch).

**Heroku / Render / Railway (FastAPI):** add a `Procfile` next to `api.py`:

```
web: uvicorn 10_NLP.app.api:app --host 0.0.0.0 --port $PORT
```

**Docker (optional):**

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY 10_NLP/app/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt && \
    python -m spacy download en_core_web_sm
COPY 10_NLP /app/10_NLP
EXPOSE 8501
CMD ["streamlit", "run", "10_NLP/app/streamlit_app.py", "--server.port=8501", "--server.address=0.0.0.0"]
```

---

## Artifact Index (`outputs_nlp/`)

| File                              | Produced by | Purpose                              |
|-----------------------------------|-------------|--------------------------------------|
| `airline_reviews_combined.csv`    | Cell 4      | Raw union of 3 sources               |
| `airline_reviews_cleaned.csv`     | Cell 10     | Final enriched dataset (app input)   |
| `tfidf_matrix.npz`                | Cell 6      | Sparse TF-IDF features               |
| `tfidf_vocab.json`                | Cell 6      | TF-IDF vocabulary                    |
| `text_embeddings.npy`             | Cell 6      | DistilBERT mean-pooled embeddings    |
| `lda_topics.csv`                  | Cell 8      | Top-10 terms for each of 8 topics    |
| `top_entities.csv`                | Cell 9      | Top 50 named entities                |
| `nlp_export_summary.json`         | Cell 10     | Run summary + distributions          |
| `nlp_overview.png`                | Cell 11     | 4-panel validation figure            |
