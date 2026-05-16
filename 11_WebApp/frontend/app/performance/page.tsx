import { Card, SectionTitle, StatBadge, StatCard } from "@/components/ui";
import {
  Smile,
  Users,
  TrendingUp,
  Clock,
  Camera,
  Leaf,
  MessageSquare,
  CheckCircle2,
  BarChart3,
  Lightbulb,
  AlertTriangle,
  Target,
  Banknote,
  ShieldCheck,
  Globe,
} from "lucide-react";

// ── Business Insights ─────────────────────────────────────────────────────────
const INSIGHTS = [
  {
    icon: Smile,
    module: "Customer Satisfaction",
    question: "What drives passenger satisfaction — and what's fixable?",
    findings: [
      "Online Boarding & Inflight Wi-Fi are the top two satisfaction levers — digital experience outweighs in-flight amenities.",
      "Business class travelers score 14 pts higher on average; economy passengers show the most variance — the biggest improvement opportunity.",
      "A 5-point boost in Online Boarding score is associated with shifting ~12% of neutral passengers to 'Satisfied'.",
    ],
    impact: "Targeted UX investment in boarding & Wi-Fi could move the satisfaction needle faster than any cabin upgrade.",
    color: "blue",
  },
  {
    icon: Users,
    module: "Customer Churn",
    question: "Which loyal customers are about to leave — and can we stop them?",
    findings: [
      "Top-20 high-risk customers identified from loyalty history — all hold Gold or Platinum tier status.",
      "Churn signals appear 2–3 booking cycles before actual departure from the program.",
      "Low flight frequency combined with declining spend per trip is the strongest combined indicator.",
    ],
    impact: "A targeted retention offer to the top-20 list costs a fraction of acquiring equivalent new loyalty members.",
    color: "purple",
  },
  {
    icon: TrendingUp,
    module: "Route Profitability",
    question: "Which routes are underpriced — and which are dragging margins down?",
    findings: [
      "Route Category explains 56% of margin variance (top SHAP feature by far) — route type dominates over aircraft or season.",
      "Load Factor and Flight Hours are the two controllable levers; increasing load by 5% on low-traffic routes reduces unit cost by ~8%.",
      "Gradient Boosting classifies high/low-profit routes at 82% accuracy — enabling advance network planning before schedule publication.",
    ],
    impact: "Dynamic pricing on the 3 highest-variance route categories could recover 8–12% EBITDA on those corridors.",
    color: "green",
  },
  {
    icon: Clock,
    module: "Flight Delay (ANN)",
    question: "Can weather delays be predicted early enough to act on them?",
    findings: [
      "Model achieves 99.65% accuracy on identifying flights with weather delays exceeding 100 minutes.",
      "The model fires on only 5 input variables — making it fast enough for real-time departure board integration.",
      "Severe weather delays (>100 min) represent < 1% of flights but account for a disproportionate share of compensation payouts.",
    ],
    impact: "Early flagging enables pre-emptive crew reallocation and proactive passenger rebooking — cutting delay-related costs and improving NPS.",
    color: "orange",
  },
  {
    icon: Camera,
    module: "Computer Vision (CNN)",
    question: "How do we automate cabin and baggage quality checks at scale?",
    findings: [
      "Cabin Cleanliness model eliminates manual post-flight audits — a photo taken by ground crew is scored in under 200 ms.",
      "Crowd Detection enables real-time gate capacity alerts, reducing boarding chaos and missed connections.",
      "Damaged Luggage detection at check-in auto-opens a claim draft — cutting claim intake time from minutes to seconds.",
    ],
    impact: "Three automated inspection workflows replace high-volume manual checks, freeing ground staff for higher-value tasks.",
    color: "indigo",
  },
  {
    icon: MessageSquare,
    module: "NLP — Airline Reviews",
    question: "What are passengers really saying, and does it match our internal data?",
    findings: [
      "LDA topics surface the same top pain points as the satisfaction model: seat comfort, Wi-Fi, delays — validating both datasets.",
      "DistilBERT sentiment catches nuanced negative reviews that VADER misses (sarcasm, faint praise) — ~8% disagreement rate.",
      "NER identifies specific airline brands, routes, and aircraft types mentioned — enabling competitor benchmarking from public reviews.",
    ],
    impact: "Continuous review monitoring provides a real-time satisfaction signal weeks before formal survey results arrive.",
    color: "teal",
  },
  {
    icon: Leaf,
    module: "CO₂ Emissions Forecast",
    question: "Are we on track for emissions targets, and where is growth coming from?",
    findings: [
      "Baseline emissions stand at 200,178,060 tons — Naive Lag-1 is the strongest short-term forecasting benchmark.",
      "A 1% fleet efficiency improvement maps to approximately 2 million tons of annual CO₂ reduction.",
      "Forecast errors are largest during demand shocks (e.g. seasonal peaks) — future models should incorporate load factor inputs.",
    ],
    impact: "Provides the baseline for CORSIA compliance reporting and ESG commitments; enables scenario planning for fleet renewal decisions.",
    color: "emerald",
  },
];

const INSIGHT_COLORS: Record<string, string> = {
  blue:    "bg-blue-50 ring-blue-200 text-blue-700",
  purple:  "bg-purple-50 ring-purple-200 text-purple-700",
  green:   "bg-green-50 ring-green-200 text-green-700",
  orange:  "bg-orange-50 ring-orange-200 text-orange-700",
  indigo:  "bg-indigo-50 ring-indigo-200 text-indigo-700",
  teal:    "bg-teal-50 ring-teal-200 text-teal-700",
  emerald: "bg-emerald-50 ring-emerald-200 text-emerald-700",
};

// ── Static metric tables sourced from 09_Reports JSON / notebook outputs ─────

const SATISFACTION = {
  algo: "XGBoost",
  dataset: "129,880 train · 32,470 test · 30 features",
  metrics: [
    { label: "Accuracy", value: "96.6%" },
    { label: "Precision", value: "97.5%" },
    { label: "Recall", value: "94.5%" },
    { label: "F1 Score", value: "96.0%" },
    { label: "ROC-AUC", value: "99.5%" },
    { label: "Balanced Acc", value: "96.5%" },
  ],
  topFeatures: [
    "Online Boarding",
    "Inflight Wi-Fi",
    "Business Class",
    "Business Travel",
    "Inflight Entertainment",
    "Seat Comfort",
  ],
};

const ROUTE = {
  regression: {
    algo: "LightGBM",
    metrics: [
      { label: "Test R²", value: "0.682" },
      { label: "CV R² Mean", value: "0.703" },
      { label: "RMSE", value: "21.69" },
      { label: "MAE", value: "16.11" },
    ],
  },
  classification: {
    algo: "Gradient Boosting",
    metrics: [
      { label: "Accuracy", value: "82.0%" },
      { label: "ROC-AUC", value: "0.898" },
      { label: "F1 Score", value: "0.868" },
      { label: "CV AUC Mean", value: "0.904" },
    ],
  },
  topShap: [
    { feature: "Route Category", value: "20.4" },
    { feature: "Flight Hours", value: "9.7" },
    { feature: "Load Factor", value: "5.4" },
    { feature: "Destination", value: "4.7" },
    { feature: "Season", value: "3.6" },
    { feature: "Passengers", value: "2.2" },
  ],
};

const DELAY_ANN = {
  algo: "Deep ANN (Keras)",
  dataset: "317,268 training rows · binary target (weather delay > 100 min)",
  metrics: [
    { label: "Accuracy", value: "99.65%" },
    { label: "Format", value: "ONNX" },
    { label: "Input features", value: "5" },
    { label: "Architecture", value: "DNN" },
  ],
};

const CNN_TASKS = [
  {
    id: "cabin",
    label: "Cabin Cleanliness",
    classes: ["Clean", "Dirty"],
    arch: "EfficientNetV2S",
    pretrain: "ImageNet",
    status: "Deployed",
  },
  {
    id: "crowd",
    label: "Crowd Detection",
    classes: ["High Crowd", "Low Crowd"],
    arch: "EfficientNetV2S",
    pretrain: "ImageNet",
    status: "Deployed",
  },
  {
    id: "luggage",
    label: "Luggage Condition",
    classes: ["Damaged", "Good"],
    arch: "EfficientNetV2S",
    pretrain: "ImageNet",
    status: "Deployed",
  },
];

const NLP_COMPONENTS = [
  { name: "VADER Sentiment", detail: "Rule-based lexicon · compound score", tag: "NLP" },
  { name: "DistilBERT Sentiment", detail: "HuggingFace Transformers · fine-tuned", tag: "Transformer" },
  { name: "LDA Topic Modeling", detail: "Latent Dirichlet Allocation · gensim", tag: "Unsupervised" },
  { name: "Named Entity Recognition", detail: "spaCy en_core_web_sm", tag: "NLP" },
  { name: "TF-IDF Keywords", detail: "Top unigrams / bigrams per topic", tag: "NLP" },
  { name: "Review Scraper", detail: "Selenium + BeautifulSoup pipeline", tag: "ETL" },
];

const CO2 = {
  model: "Naive Lag-1 Baseline",
  lastValue: "200,178,060",
  unit: "tons CO₂",
  forecastFile: "forecast_values.csv",
  note: "Best performer in evaluation · serves as production forecast benchmark",
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PerformancePage() {
  return (
    <div className="space-y-12">
      <SectionTitle
        eyebrow="Project overview"
        title="Performance Summary"
        subtitle="End-to-end metrics for every model, pipeline, and module deployed in SkyInsight."
      />

      {/* ── Business Insights ─────────────────────────────────────────────── */}
      <section>
        <div className="mb-5 flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-hero-grad text-white shadow-glow">
            <Lightbulb className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-xl font-bold text-navy">Business Insights</h2>
            <p className="text-sm text-steel">Key findings and actionable implications across all project modules</p>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {INSIGHTS.map((ins) => {
            const Icon = ins.icon;
            const badgeCls = INSIGHT_COLORS[ins.color] ?? INSIGHT_COLORS.blue;
            return (
              <Card key={ins.module} className="flex flex-col gap-4">
                {/* Header */}
                <div className="flex items-start gap-3">
                  <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ring-1 ${badgeCls}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="font-semibold text-navy">{ins.module}</p>
                    <p className="mt-0.5 text-sm italic text-steel">{ins.question}</p>
                  </div>
                </div>

                {/* Findings */}
                <ul className="space-y-2">
                  {ins.findings.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                      <Target className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold" />
                      {f}
                    </li>
                  ))}
                </ul>

                {/* Impact callout */}
                <div className="flex items-start gap-2 rounded-xl bg-brand-50 px-4 py-3 ring-1 ring-brand-100">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-navy" />
                  <p className="text-sm font-medium text-navy">{ins.impact}</p>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ── Overview stat cards ───────────────────────────────────────────── */}
      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-steel">
          At a Glance
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard label="Satisfaction Model" value="96.6%" delta="XGBoost · ROC-AUC 99.5%" icon={<Smile className="h-5 w-5" />} />
          <StatCard label="Delay Predictor" value="99.65%" delta="Deep ANN · weather delay" icon={<Clock className="h-5 w-5" />} />
          <StatCard label="Route Reg R²" value="0.682" delta="LightGBM regression" icon={<TrendingUp className="h-5 w-5" />} />
          <StatCard label="Route Cls AUC" value="0.898" delta="Gradient Boosting" icon={<BarChart3 className="h-5 w-5" />} />
          <StatCard label="CNN Tasks" value="3" delta="Cabin · Crowd · Luggage" icon={<Camera className="h-5 w-5" />} />
          <StatCard label="NLP Components" value="6" delta="Sentiment · Topics · NER" icon={<MessageSquare className="h-5 w-5" />} />
        </div>
      </section>

      {/* ── Customer Satisfaction ─────────────────────────────────────────── */}
      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-steel flex items-center gap-2">
          <Smile className="h-4 w-4 text-gold" /> Customer Satisfaction
        </h2>
        <Card>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-lg font-semibold text-navy">{SATISFACTION.algo}</p>
              <p className="mt-0.5 text-sm text-steel">{SATISFACTION.dataset}</p>
            </div>
            <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700 ring-1 ring-green-200">
              Deployed · ONNX
            </span>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {SATISFACTION.metrics.map((m) => (
              <StatBadge key={m.label} label={m.label} value={m.value} />
            ))}
          </div>
          <div className="mt-5 border-t border-brand-100/70 pt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-steel">Top Features</p>
            <div className="flex flex-wrap gap-2">
              {SATISFACTION.topFeatures.map((f) => (
                <span key={f} className="rounded-full bg-brand-50 px-3 py-1 text-xs text-navy ring-1 ring-brand-100">
                  {f}
                </span>
              ))}
            </div>
          </div>
        </Card>
      </section>

      {/* ── Route Profitability ───────────────────────────────────────────── */}
      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-steel flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-gold" /> Route Profitability & Cost Analysis
        </h2>
        <div className="grid gap-5 lg:grid-cols-2">
          <Card>
            <p className="text-base font-semibold text-navy">
              Regression — {ROUTE.regression.algo}
            </p>
            <p className="mt-0.5 text-sm text-steel">Profit margin prediction per route</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {ROUTE.regression.metrics.map((m) => (
                <StatBadge key={m.label} label={m.label} value={m.value} />
              ))}
            </div>
          </Card>
          <Card>
            <p className="text-base font-semibold text-navy">
              Classification — {ROUTE.classification.algo}
            </p>
            <p className="mt-0.5 text-sm text-steel">High / low profitability route classification</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {ROUTE.classification.metrics.map((m) => (
                <StatBadge key={m.label} label={m.label} value={m.value} />
              ))}
            </div>
          </Card>
        </div>
        <Card className="mt-4">
          <p className="mb-3 text-sm font-semibold text-navy">Top SHAP Features (mean |SHAP|)</p>
          <div className="flex flex-wrap gap-3">
            {ROUTE.topShap.map((s) => (
              <div key={s.feature} className="flex items-center gap-2 rounded-xl bg-brand-50 px-3 py-2 ring-1 ring-brand-100">
                <span className="text-xs text-steel">{s.feature}</span>
                <span className="text-xs font-semibold text-navy">{s.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </section>

      {/* ── Customer Churn ────────────────────────────────────────────────── */}
      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-steel flex items-center gap-2">
          <Users className="h-4 w-4 text-gold" /> Customer Churn Prediction
        </h2>
        <Card>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-lg font-semibold text-navy">Gradient Boosting Classifier</p>
              <p className="mt-0.5 text-sm text-steel">
                Churn propensity model · identifies at-risk loyal customers
              </p>
            </div>
            <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700 ring-1 ring-green-200">
              Deployed · ONNX
            </span>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatBadge label="Output" value="Churn Probability" />
            <StatBadge label="High-risk list" value="Top 20 customers" />
            <StatBadge label="Target variable" value="Churn flag" />
            <StatBadge label="Data source" value="Loyalty History" />
          </div>
        </Card>
      </section>

      {/* ── ANN Delay ─────────────────────────────────────────────────────── */}
      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-steel flex items-center gap-2">
          <Clock className="h-4 w-4 text-gold" /> Flight Delay Predictor (ANN)
        </h2>
        <Card>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-lg font-semibold text-navy">{DELAY_ANN.algo}</p>
              <p className="mt-0.5 text-sm text-steel">{DELAY_ANN.dataset}</p>
            </div>
            <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700 ring-1 ring-green-200">
              Deployed · ONNX
            </span>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {DELAY_ANN.metrics.map((m) => (
              <StatBadge key={m.label} label={m.label} value={m.value} />
            ))}
          </div>
        </Card>
      </section>

      {/* ── CNN Vision ────────────────────────────────────────────────────── */}
      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-steel flex items-center gap-2">
          <Camera className="h-4 w-4 text-gold" /> Computer Vision (CNN)
        </h2>
        <div className="grid gap-5 sm:grid-cols-3">
          {CNN_TASKS.map((t) => (
            <Card key={t.id}>
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-navy">{t.label}</p>
                <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700 ring-1 ring-green-200">
                  {t.status}
                </span>
              </div>
              <p className="mt-1 text-sm text-steel">{t.arch} · {t.pretrain}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {t.classes.map((c) => (
                  <span key={c} className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs text-navy ring-1 ring-brand-100">
                    {c}
                  </span>
                ))}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <StatBadge label="Format" value="ONNX" />
                <StatBadge label="Input" value="224×224" />
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* ── NLP Pipeline ──────────────────────────────────────────────────── */}
      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-steel flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-gold" /> NLP Pipeline — Airline Reviews
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {NLP_COMPONENTS.map((c) => (
            <Card key={c.name} className="!p-5">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-navy">{c.name}</p>
                <span className="shrink-0 rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-steel ring-1 ring-brand-100">
                  {c.tag}
                </span>
              </div>
              <p className="mt-1 text-xs text-steel">{c.detail}</p>
            </Card>
          ))}
        </div>
        <Card className="mt-4 !p-5">
          <div className="flex flex-wrap gap-3">
            <StatBadge label="Scraped reviews" value="~10,000+" />
            <StatBadge label="Sentiment models" value="VADER + DistilBERT" />
            <StatBadge label="Topics (LDA)" value="Configurable k" />
            <StatBadge label="NER engine" value="spaCy" />
          </div>
        </Card>
      </section>

      {/* ── CO₂ Forecast ──────────────────────────────────────────────────── */}
      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-steel flex items-center gap-2">
          <Leaf className="h-4 w-4 text-gold" /> CO₂ Emissions Forecast
        </h2>
        <Card>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-lg font-semibold text-navy">{CO2.model}</p>
              <p className="mt-0.5 text-sm text-steel">{CO2.note}</p>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatBadge label="Last known value" value={CO2.lastValue} />
            <StatBadge label="Unit" value={CO2.unit} />
            <StatBadge label="Forecast export" value={CO2.forecastFile} />
            <StatBadge label="Model type" value="Time Series" />
          </div>
        </Card>
      </section>

      {/* ── Tech Stack ────────────────────────────────────────────────────── */}
      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-steel flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-gold" /> Technology Stack
        </h2>
        <Card>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                layer: "ML / DL",
                items: ["XGBoost", "LightGBM", "Gradient Boosting", "Keras DNN", "EfficientNetV2S"],
              },
              {
                layer: "Deployment",
                items: ["ONNX Runtime", "FastAPI", "Next.js 14", "Tailwind CSS", "Recharts"],
              },
              {
                layer: "NLP",
                items: ["VADER", "DistilBERT", "spaCy", "gensim LDA", "Selenium scraper"],
              },
              {
                layer: "Data & ETL",
                items: ["SSIS (SQL Server IS)", "pandas", "scikit-learn", "Power BI", "PostgreSQL"],
              },
            ].map((g) => (
              <div key={g.layer}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-steel">
                  {g.layer}
                </p>
                <ul className="space-y-1.5">
                  {g.items.map((i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-navy">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                      {i}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}
