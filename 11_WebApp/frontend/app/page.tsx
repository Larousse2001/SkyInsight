import Link from "next/link";
import {
  ArrowRight, Brain, Camera, Clock, Leaf, Smile, TrendingUp, Users,
  MessageSquare, BarChart3, Shield, Zap, CheckCircle2, Sparkles,
} from "lucide-react";
import { Card, Pill, SectionTitle } from "@/components/ui";

const PROJECTS = [
  { href: "/predict/satisfaction", icon: Smile,         title: "Customer Satisfaction",    tag: "XGBoost",      desc: "Predict passenger satisfaction from 20+ flight experience signals." },
  { href: "/predict/delay",        icon: Clock,         title: "Flight Delay Risk",        tag: "Deep ANN",     desc: "Probability of arrival delay from BTS delay-cause features." },
  { href: "/predict/cnn",          icon: Camera,        title: "Cabin · Crowd · Luggage",  tag: "EfficientNetV2", desc: "Three image classifiers with TTA and temperature scaling." },
  { href: "/dashboard",            icon: TrendingUp,    title: "Route Profitability",      tag: "LightGBM",     desc: "Margin regression + profitability classifier with SHAP." },
  { href: "/forecast/co2",         icon: Leaf,          title: "CO₂ Emissions Forecast",   tag: "Time series",  desc: "Annual fleet emissions, Naive-Lag1 vs ML baselines." },
  { href: "/dashboard",            icon: Users,         title: "Churn Risk",               tag: "Logistic Reg.",desc: "Top high-risk loyalty customers, ranked by churn probability." },
  { href: "/nlp",                  icon: MessageSquare, title: "Review Intelligence (NLP)",tag: "DistilBERT + LDA", desc: "Sentiment, topics, entities and live analyser on scraped airline reviews." },
  { href: "/bi",                   icon: BarChart3,     title: "Power BI — Live Reports",  tag: "AirlineDW",    desc: "Embedded executive Power BI workspace, refreshed from the data warehouse." },
];

const FEATURES = [
  { icon: Zap,    title: "Real-time inference",     desc: "ONNX-Runtime serves every model in <50 ms — call them from any of your tools." },
  { icon: Shield, title: "Production-grade pipelines", desc: "Versioned schemas, deterministic preprocessing, full reproducibility." },
  { icon: Sparkles, title: "Explainable by default", desc: "SHAP, feature importance, calibration and confidence scores on every prediction." },
];

const KPIS = [
  { label: "ML & DL models",    value: "8+" },
  { label: "Avg. test accuracy", value: "94%" },
  { label: "Reviews analysed",  value: "30k+" },
  { label: "End-to-end latency", value: "<50ms" },
];

export default function HomePage() {
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden rounded-3xl bg-hero-grad px-6 py-16 sm:px-12 shadow-glow">
        <div className="absolute inset-0 -z-10 opacity-30"
          style={{ backgroundImage: "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.25), transparent 40%), radial-gradient(circle at 80% 70%, rgba(255,197,112,0.4), transparent 40%)" }} />
        <Pill tone="gold"><Brain className="mr-1.5 h-3 w-3 inline" /> AI Operations for Airlines</Pill>
        <h1 className="mt-5 max-w-4xl text-4xl font-extrabold tracking-tight text-white sm:text-6xl font-display">
          One platform for every{" "}
          <span className="text-gold">flight-data decision</span>.
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-brand-100/90">
          SkyInsight unifies machine learning, deep learning, computer vision, NLP review intelligence
          and live Power BI — so revenue, ops and CX teams work from the same single source of truth.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl bg-gold px-6 py-3 text-sm font-semibold text-navy shadow-glow transition hover:brightness-95">
            Open Dashboard <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/bi"
            className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-6 py-3 text-sm font-semibold text-white ring-1 ring-white/30 backdrop-blur hover:bg-white/20">
            View Power BI
          </Link>
          <Link href="/predict/satisfaction"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-navy ring-1 ring-white/40 hover:bg-brand-50">
            Try a live model
          </Link>
        </div>

        {/* KPI strip */}
        <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {KPIS.map((k) => (
            <div key={k.label} className="rounded-2xl bg-white/10 px-4 py-4 ring-1 ring-white/20 backdrop-blur">
              <div className="text-2xl font-bold text-white">{k.value}</div>
              <div className="text-[11px] uppercase tracking-widest text-brand-100/80">{k.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* WHY */}
      <section className="mt-16">
        <SectionTitle eyebrow="Why SkyInsight" title="Built for airlines that ship decisions, not slides" />
        <div className="grid gap-5 sm:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <Card key={title}>
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-gold-grad text-navy shadow-soft">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-lg font-semibold text-navy">{title}</h3>
              <p className="mt-1 text-sm text-steel">{desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* PRODUCT GRID */}
      <section className="mt-16">
        <SectionTitle eyebrow="Modules" title="Every model, every dashboard, in one place" subtitle="From a churn risk list at 9am to a CNN luggage inspection at 9pm." />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {PROJECTS.map(({ href, icon: Icon, title, tag, desc }) => (
            <Link key={title + href} href={href} className="group">
              <Card className="h-full transition-all hover:-translate-y-0.5">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-navy-grad text-gold shadow-soft">
                    <Icon className="h-5 w-5" />
                  </span>
                  <Pill tone="sand">{tag}</Pill>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-navy">{title}</h3>
                <p className="mt-1 text-sm text-steel">{desc}</p>
                <p className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-steel group-hover:gap-2 group-hover:text-navy transition-all">
                  Open <ArrowRight className="h-4 w-4" />
                </p>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mt-20 overflow-hidden rounded-3xl bg-navy-grad px-6 py-12 sm:px-12 shadow-glow">
        <div className="grid items-center gap-8 md:grid-cols-2">
          <div>
            <Pill tone="gold">Ready when you are</Pill>
            <h3 className="mt-3 text-3xl font-bold text-white font-display">
              Stop guessing. Start <span className="text-gold">flying on data</span>.
            </h3>
            <p className="mt-3 text-brand-100/85">
              Book a 30-minute walkthrough — we’ll plug SkyInsight into a sample of your data and ship
              your first predictions before the call ends.
            </p>
          </div>
          <ul className="space-y-3 text-brand-100">
            {[
              "Production-ready models exported to ONNX",
              "Embedded Power BI, refreshed from the warehouse",
              "Review intelligence (sentiment + topics + entities)",
              "Custom training on your own fleet data",
            ].map((b) => (
              <li key={b} className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-gold mt-0.5" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
