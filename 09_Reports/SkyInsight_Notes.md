# SkyInsight — Project Notes

---

## Project Description

**SkyInsight** is a full-stack, production-grade AI platform built for the airline industry. It
ingests raw operational and customer data, processes it through a structured SQL Server data
warehouse, runs it through multiple machine learning pipelines, and surfaces insights via a
modern Next.js web application — all in a single, coherent system.

The platform bridges the gap between raw data and real decisions. Whether an analyst needs to
understand why passengers are dissatisfied, a ground manager needs to predict the next delay, or
a sustainability lead needs to track carbon output per route — SkyInsight delivers the answer in
one place, in real time.

The system covers the full AI lifecycle: data ingestion and cleaning → feature engineering →
model training → ONNX export → FastAPI serving → interactive front-end. Every layer is built
and owned within the project, with no black-box third-party ML services.

---

## Project Themes

### 1. End-to-End AI Ownership
Every component — from raw CSV cleaning and data warehouse design to model training, ONNX
conversion, REST API serving, and the React UI — is part of the project. There is no reliance
on hosted ML services. This means full control over model versioning, inference speed,
explainability, and data privacy.

### 2. Real-Time Intelligence
Models are exported to the ONNX format and served via ONNX Runtime on a FastAPI backend.
This decouples inference from training frameworks (TensorFlow, scikit-learn) and delivers
sub-second prediction latency. The frontend calls live APIs — every prediction is live, not
pre-computed.

### 3. Customer Centricity
The majority of modules focus on the passenger experience: satisfaction scoring, loyalty
clustering, churn risk profiling, NLP sentiment on reviews, and delay risk forecasting. The
platform is designed so that customer-facing improvements can be tracked, modelled, and acted
upon in one tool.

### 4. Operational Safety & Reliability
Flight delay prediction reduces scheduling risk. The Smart Vision module uses CNN classifiers
to detect luggage damage, cabin cleanliness issues, and crowd density — replacing ad-hoc
visual inspections with automated quality checks before and after flights.

### 5. Sustainability & Green Aviation
The CO₂ Forecasting module models carbon emissions per route using regression. Airlines can
use it to identify high-emission routes, model the impact of fleet changes, and report against
environmental targets — supporting ICAO carbon offsetting goals.

### 6. Data-Driven Decision Making
The Decision Insights module connects directly to the data warehouse and exposes KPIs, route
profitability, loyalty segment breakdowns, and satisfaction drivers through interactive BI
dashboards. Business leaders can explore the same data that feeds the ML models, closing the
loop between analytics and action.

---

## SDG Alignment

SkyInsight is explicitly mapped to three UN Sustainable Development Goals, as documented in the
project presentation (*Airline Loyalty & Passenger Satisfaction — End-to-End Data Engineering
Platform*):

### 🟠 SDG 9 — Industry, Innovation & Infrastructure
> *Build resilient infrastructure, promote inclusive and sustainable industrialisation, and foster innovation.*

| Feature | Description |
|---|---|
| Smart Route Optimisation | Predicts flight load factor to maximise aircraft utilisation and reduce per-seat emissions |
| Airport Crowd Analytics | CNN-based crowd density detection reduces gate congestion and boarding wait times |
| Delay Prediction | ANN-based forecasting minimises ground delays and improves schedule reliability |
| Operational KPI Dashboard | Real-time efficiency metrics for airline operations managers |

### 🟡 SDG 12 — Responsible Consumption & Production
> *Ensure sustainable consumption and production patterns.*

| Feature | Description |
|---|---|
| Fuel Usage Tracking | Benchmarks fuel consumption per passenger-km per route via the BI module |
| Cabin Cleanliness Vision | Targets cleaning where needed, reducing unnecessary chemical usage |
| Baggage Handling QC | Luggage damage detection reduces material waste and claims processing |
| NLP Transparency Reports | Sentiment pipeline supports responsible service quality communication |

### 🟢 SDG 13 — Climate Action
> *Take urgent action to combat climate change and its impacts.*

| Feature | Description |
|---|---|
| Carbon Footprint Prediction | ML regression model estimates CO₂ per route by load factor, aircraft type, and season |
| Emission Trend Dashboard | Year-over-year carbon KPI tracking in the Decision Insights module |
| High-Emission Route Flagging | Offset recommendation engine identifies routes requiring carbon intervention |
| Sustainability Scorecard | Power BI integration for executive-level environmental reporting |

---

## Module Summary

| Module              | Type                  | Model / Method                    | Key Output                          |
|---------------------|-----------------------|-----------------------------------|-------------------------------------|
| Decision Insights   | Business Intelligence | SQL DW + Power BI                 | KPI dashboards, route analytics     |
| Satisfaction Predict| Classification        | Logistic Regression (ONNX)        | Satisfaction probability (0–1)      |
| Delay Prediction    | Classification        | Artificial Neural Network (ONNX)  | Delay risk with confidence score    |
| Loyal Circle        | Clustering            | K-Means (4 clusters)              | Loyalty & churn segment profiles    |
| CO₂ Forecasting     | Regression            | Gradient Boosting (ONNX)          | Predicted CO₂ per route (kg)        |
| Smart Vision        | Image Classification  | EfficientNetV2-S CNN × 3 (ONNX)   | Luggage / cleanliness / crowd class |
| Reviews NLP         | NLP Pipeline          | VADER + RoBERTa + LDA             | Sentiment scores + topic clusters   |
| Performance Hub     | Reporting             | Aggregated metrics                | Cross-model business impact report  |

---

## Technical Architecture

```
┌─────────────────────────────────────────────┐
│               Next.js 15 Frontend            │
│         TypeScript · Tailwind · Recharts     │
│                   Port 3000                  │
└────────────┬──────────────────┬─────────────┘
             │ /api/*           │ /api/nlp/*
             ▼                  ▼
┌─────────────────┐   ┌─────────────────────┐
│  FastAPI Core   │   │    NLP FastAPI       │
│  ONNX Runtime   │   │  VADER · RoBERTa     │
│   Port 8000     │   │     Port 8001        │
└────────┬────────┘   └─────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────┐
│            ONNX Model Files                  │
│  satisfaction · delay · co2 · cnn × 3       │
│           (.onnx, Git LFS)                   │
└─────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────┐
│           SQL Server Data Warehouse          │
│   Dim_Customer · Dim_Date · Fact_Activity   │
│          Fact_Satisfaction (SSIS ETL)        │
└─────────────────────────────────────────────┘
```

### Key Technology Choices

| Layer          | Technology                          | Reason                                      |
|----------------|-------------------------------------|---------------------------------------------|
| ML Training    | scikit-learn, TensorFlow 2.21       | Broad model support, mature ecosystem       |
| Model Serving  | ONNX Runtime 1.26                   | Framework-agnostic, fast inference          |
| Backend API    | FastAPI (Python)                    | Async, auto-docs, Pydantic validation       |
| Frontend       | Next.js 15 App Router               | SSR + CSR hybrid, TypeScript, fast routing  |
| Styling        | Tailwind CSS + custom design tokens | Consistent brand colours (navy/gold/steel)  |
| Charts         | Recharts                            | React-native, composable, lightweight       |
| Data Warehouse | SQL Server + SSIS                   | Enterprise-grade ETL and star schema        |
| Version Control| Git + Git LFS                       | Large ONNX files tracked without bloating   |

---

## Data Sources

- **Customer Loyalty History** — 16,737 records, loyalty programme demographics and tier data
- **Customer Flight Activity** — 129,487 records, flight bookings, points earned/redeemed
- **Passenger Satisfaction** — 129,880 records, in-flight service ratings (22 features)
- **Airline Reviews (scraped)** — Web-scraped reviews from aviation review platforms
- **CO₂ Dataset** — Route-level emissions and efficiency metrics

---

## Repository

**GitHub:** `https://github.com/Larousse2001/SkyInsight`
**Branch:** `main`
**Storage:** Git LFS for `.onnx` model files
