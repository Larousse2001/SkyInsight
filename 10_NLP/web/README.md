# SkyInsight NLP — Modern Web App

Next.js 14 (App Router, TypeScript, Tailwind, Recharts) frontend + FastAPI backend.
Replaces the legacy Streamlit app.

## Architecture

```
┌──────────────────┐     HTTP/JSON      ┌─────────────────────┐
│  Next.js 14 UI   │ ─────────────────► │  FastAPI (Python)   │
│  (port 3000)     │ ◄───────────────── │  (port 8000)        │
└──────────────────┘                    └─────────────────────┘
       │                                          │
       ├─ Server Components (cached fetch)        ├─ VADER + DistilBERT
       ├─ Recharts visualisations                 ├─ Pandas (LRU-cached)
       └─ Tailwind dark UI                        └─ CORS for localhost:3000
```

## Why this beats Streamlit

| Aspect | Streamlit | Next.js + FastAPI |
|---|---|---|
| Page load | Full Python rerun per click | Static + cached SSR |
| State | Global rerun | Component-level |
| Styling | Limited theming | Full Tailwind + custom UI |
| Charts | Server-rendered | Interactive client SVG |
| API | None | REST + OpenAPI docs |
| Mobile | Poor | Responsive |
| Deploy | Single process | Vercel / any host |

## Run locally

### 1. Backend (FastAPI)

```powershell
# from project root
c:/python313/python.exe -m pip install -r 10_NLP/app/requirements.txt --user
c:/python313/python.exe -m uvicorn 10_NLP.app.api:app --reload --port 8000
```

Open Swagger: http://localhost:8000/docs

### 2. Frontend (Next.js)

```powershell
cd 10_NLP/web
npm install
npm run dev
```

Open: http://localhost:3000

## Pages

- `/` — Overview: KPIs, sentiment & topic distributions, histogram
- `/analyze` — Real-time VADER + DistilBERT on any text
- `/topics` — LDA topics with top terms
- `/entities` — Named entities grouped by label
- `/reviews` — Searchable, paginated reviews with filters

## Production build

```powershell
cd 10_NLP/web
npm run build
npm run start    # serves on :3000
```

Deploy frontend to Vercel; backend to Render / Fly / any container host. Update
`NEXT_PUBLIC_API_BASE` in `.env.local` to point to the deployed API.
