import Link from "next/link";
import { ArrowRight, Brain, Camera, Clock, Leaf, Smile, TrendingUp, Users } from "lucide-react";
import { Card } from "@/components/ui";

const PROJECTS = [
  { href: "/predict/satisfaction", icon: Smile,      title: "Customer Satisfaction", tag: "XGBoost", desc: "Predict passenger satisfaction from 20+ flight experience signals." },
  { href: "/predict/delay",        icon: Clock,      title: "Flight Delay",          tag: "Deep ANN", desc: "Probability of arrival delay from BTS delay-cause features." },
  { href: "/predict/cnn",          icon: Camera,     title: "Cabin · Crowd · Luggage", tag: "EfficientNetV2", desc: "Three image classifiers with TTA and temperature scaling." },
  { href: "/dashboard",            icon: TrendingUp, title: "Route Profitability",   tag: "LightGBM", desc: "Margin regression + profitability classifier with SHAP." },
  { href: "/forecast/co2",         icon: Leaf,       title: "CO₂ Emissions Forecast", tag: "Time series", desc: "Annual fleet emissions, Naive-Lag1 vs ML baselines." },
  { href: "/dashboard",            icon: Users,      title: "Churn Risk",            tag: "Logistic Reg.", desc: "Top-20 high-risk loyalty customers, ranked by churn probability." },
];

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden rounded-3xl border border-white/60 bg-white/60 px-6 py-14 sm:px-12 shadow-xl shadow-slate-200/40">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-brand-50 via-white to-indigo-50" />
        <p className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
          <Brain className="h-3.5 w-3.5" /> AI Insights for Airlines
        </p>
        <h1 className="mt-4 max-w-3xl text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          From raw flight data to{" "}
          <span className="bg-gradient-to-r from-brand-600 to-indigo-600 bg-clip-text text-transparent">
            real-time decisions
          </span>
          .
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-slate-600">
          SkyInsight unifies our six ML, ANN and CNN reports into one interactive surface — explore
          metrics or run live predictions against the exported ONNX models.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-slate-800"
          >
            Open Dashboard <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/predict/satisfaction"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 ring-1 ring-slate-200 hover:bg-slate-50"
          >
            Try a live prediction
          </Link>
        </div>
      </section>

      <section className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {PROJECTS.map(({ href, icon: Icon, title, tag, desc }) => (
          <Link key={title + href} href={href} className="group">
            <Card className="h-full transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-brand-500/10">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-indigo-600 text-white">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">{tag}</span>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">{title}</h3>
              <p className="mt-1 text-sm text-slate-600">{desc}</p>
              <p className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 group-hover:gap-2 transition-all">
                Explore <ArrowRight className="h-4 w-4" />
              </p>
            </Card>
          </Link>
        ))}
      </section>
    </>
  );
}
