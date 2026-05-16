"use client";

import { Card, SectionTitle, StatBadge, StatCard } from "@/components/ui";
import {
  Users,
  AlertTriangle,
  ShieldCheck,
  Target,
  TrendingDown,
  Clock,
  Layers,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";

// ── Types ─────────────────────────────────────────────────────────────────────
type ClusterRow = {
  cluster: number;
  size: number;
  satisfaction_rate: number;
  avg_total_delay: number;
  churn_proxy: number;
};
type ModelRow = Record<string, number | string>;
type HighRiskRow = {
  loyalty_number: string | number;
  date: string;
  churn: number;
  pred_churn: number;
  churn_probability: number;
};

// ── Cluster metadata ──────────────────────────────────────────────────────────
const CLUSTER_META: Record<number, { label: string; description: string; color: string; hex: string; risk: string }> = {
  0: {
    label: "Loyal Regulars",
    description: "Large base of satisfied passengers with minimal delays and stable loyalty.",
    color: "text-green-700 bg-green-50 ring-green-200",
    hex: "#16a34a",
    risk: "Low",
  },
  1: {
    label: "At-Risk Frequent Flyers",
    description: "Largest segment — good delay profile but highest churn rate despite satisfaction.",
    color: "text-amber-700 bg-amber-50 ring-amber-200",
    hex: "#d97706",
    risk: "Moderate",
  },
  2: {
    label: "Occasional At-Risk",
    description: "Mid-size segment with moderate churn likelihood and average delay sensitivity.",
    color: "text-orange-700 bg-orange-50 ring-orange-200",
    hex: "#ea580c",
    risk: "Moderate",
  },
  3: {
    label: "Critical — Delay Victims",
    description: "Smallest but most dangerous: extreme average delays (137 min) and 100% churn proxy.",
    color: "text-red-700 bg-red-50 ring-red-200",
    hex: "#dc2626",
    risk: "Critical",
  },
};

const RISK_COLORS: Record<string, string> = {
  Low:      "bg-green-50 text-green-700 ring-green-200",
  Moderate: "bg-amber-50 text-amber-700 ring-amber-200",
  Critical: "bg-red-50 text-red-700 ring-red-200",
};

const MODEL_COLORS = ["#1A3263", "#547792", "#FFC570"];

// ── Helpers ───────────────────────────────────────────────────────────────────
function pct(v: number) { return `${(v * 100).toFixed(1)}%`; }
function fmt(v: number) { return v.toFixed(2); }

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ClusteringPage() {
  const [clusters, setClusters] = useState<ClusterRow[]>([]);
  const [models, setModels] = useState<ModelRow[]>([]);
  const [highRisk, setHighRisk] = useState<HighRiskRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/reports/cluster-analysis").then((r) => r.json()),
      fetch("/api/reports/high-risk-customers").then((r) => r.json()),
    ])
      .then(([cluster, risk]) => {
        setClusters(cluster.clusters ?? []);
        setModels(cluster.model_comparison ?? []);
        setHighRisk(risk.rows ?? []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-steel animate-pulse">Loading clustering data…</p>
      </div>
    );
  }

  if (error || clusters.length === 0) {
    return (
      <Card>
        <SectionTitle eyebrow="Clustering" title="Backend offline" />
        <p className="text-slate-600">
          Could not reach <code className="rounded bg-slate-100 px-1">localhost:8000</code>. Start the FastAPI backend first.
        </p>
      </Card>
    );
  }

  // Sort clusters ascending for display
  const sorted = [...clusters].sort((a, b) => a.cluster - b.cluster);
  const totalPassengers = sorted.reduce((s, c) => s + c.size, 0);
  const criticalCluster = sorted.find((c) => c.cluster === 3);
  const maxChurnCluster = sorted.reduce((max, c) => (c.churn_proxy > max.churn_proxy ? c : max), sorted[0]);

  // Chart data
  const churnBarData = sorted.map((c) => ({
    name: `C${c.cluster}`,
    label: CLUSTER_META[c.cluster]?.label ?? `Cluster ${c.cluster}`,
    "Churn Proxy %": +(c.churn_proxy * 100).toFixed(1),
    fill: CLUSTER_META[c.cluster]?.hex ?? "#547792",
  }));

  const delayBarData = sorted.map((c) => ({
    name: `C${c.cluster}`,
    "Avg Delay (min)": +c.avg_total_delay.toFixed(1),
    fill: CLUSTER_META[c.cluster]?.hex ?? "#547792",
  }));

  const pieData = sorted.map((c) => ({
    name: CLUSTER_META[c.cluster]?.label ?? `C${c.cluster}`,
    value: c.size,
    fill: CLUSTER_META[c.cluster]?.hex ?? "#547792",
  }));

  const radarData = sorted.map((c) => ({
    cluster: `C${c.cluster}`,
    "Churn Risk": +(c.churn_proxy * 100).toFixed(1),
    "Avg Delay": +Math.min(c.avg_total_delay, 50).toFixed(1), // cap at 50 for visual
    "Size (k)": +(c.size / 1000).toFixed(1),
  }));

  return (
    <div className="space-y-12">
      <SectionTitle
        eyebrow="K-Means Segmentation"
        title="Loyalty Clustering & Churn Analysis"
        subtitle="129,880 passengers segmented into 4 behavioral clusters based on satisfaction, delay profile, and loyalty activity."
      />

      {/* ── KPI cards ────────────────────────────────────────────────────── */}
      <section>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Passengers"
            value={totalPassengers.toLocaleString()}
            delta="Segmented via K-Means"
            icon={<Users className="h-5 w-5" />}
          />
          <StatCard
            label="Clusters Found"
            value="4"
            delta="Optimal K by elbow method"
            icon={<Layers className="h-5 w-5" />}
          />
          <StatCard
            label="Critical Cluster Size"
            value={criticalCluster ? criticalCluster.size.toLocaleString() : "—"}
            delta="100% churn proxy · 137 min avg delay"
            icon={<AlertTriangle className="h-5 w-5" />}
          />
          <StatCard
            label="High-Risk Customers"
            value="20"
            delta="Flagged from loyalty history"
            icon={<Target className="h-5 w-5" />}
          />
        </div>
      </section>

      {/* ── Business insight banner ───────────────────────────────────────── */}
      <section>
        <div className="rounded-2xl border border-amber-200 bg-amber-50/60 px-6 py-5 shadow-soft">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
            <div>
              <p className="font-semibold text-navy">Key Business Finding</p>
              <p className="mt-1 text-sm text-slate-700">
                <strong>Cluster 3 (Critical)</strong> is a small but high-value alarm signal — just{" "}
                <strong>{criticalCluster?.size.toLocaleString()} passengers</strong> with an average weather delay of{" "}
                <strong>137 minutes</strong> show a <strong>100% churn proxy rate</strong>. These passengers did not
                return. Preventing one passenger from entering this cluster through proactive rebooking or compensation is
                worth significantly more than the cost of intervention.
              </p>
              <p className="mt-2 text-sm text-slate-700">
                <strong>Clusters 1 & 2</strong> ({((sorted.filter(c => c.cluster === 1 || c.cluster === 2).reduce((s,c)=>s+c.size,0)/totalPassengers)*100).toFixed(0)}% of all
                passengers) show 20–22% churn proxy despite normal delay profiles — suggesting satisfaction drivers beyond operational performance
                (loyalty program value, pricing, competitor alternatives).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Cluster profile cards ─────────────────────────────────────────── */}
      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-steel flex items-center gap-2">
          <Layers className="h-4 w-4 text-gold" /> Cluster Profiles
        </h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {sorted.map((c) => {
            const meta = CLUSTER_META[c.cluster];
            return (
              <Card key={c.cluster} className="flex flex-col gap-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${meta.color}`}>
                      {meta.risk} Risk
                    </span>
                    <p className="mt-2 font-semibold text-navy">{meta.label}</p>
                    <p className="mt-0.5 text-xs text-steel">{meta.description}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <StatBadge label="Passengers" value={c.size.toLocaleString()} />
                  <StatBadge label="Share" value={pct(c.size / totalPassengers)} />
                  <StatBadge label="Churn Proxy" value={pct(c.churn_proxy)} />
                  <StatBadge label="Avg Delay" value={`${c.avg_total_delay.toFixed(0)} min`} />
                </div>
                {/* Churn visual bar */}
                <div>
                  <p className="mb-1 text-[10px] uppercase tracking-wider text-steel">Churn Risk</p>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-brand-100">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(c.churn_proxy * 100).toFixed(0)}%`,
                        backgroundColor: meta.hex,
                      }}
                    />
                  </div>
                  <p className="mt-1 text-right text-xs font-semibold" style={{ color: meta.hex }}>
                    {pct(c.churn_proxy)}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ── Charts row ────────────────────────────────────────────────────── */}
      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-steel flex items-center gap-2">
          <TrendingDown className="h-4 w-4 text-gold" /> Churn Proxy & Delay by Cluster
        </h2>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Churn bar */}
          <Card>
            <p className="mb-4 text-sm font-semibold text-navy">Churn Proxy Rate per Cluster (%)</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={churnBarData} barSize={44}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#547792" }} />
                <YAxis tick={{ fontSize: 12, fill: "#547792" }} unit="%" domain={[0, 110]} />
                <Tooltip
                  formatter={(v: number) => [`${v}%`, "Churn Proxy"]}
                  labelFormatter={(l) => churnBarData.find((d) => d.name === l)?.label ?? l}
                />
                <Bar dataKey="Churn Proxy %" radius={[6, 6, 0, 0]}>
                  {churnBarData.map((d, i) => (
                    <Cell key={i} fill={d.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Delay bar */}
          <Card>
            <p className="mb-4 text-sm font-semibold text-navy">Average Total Delay per Cluster (min)</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={delayBarData} barSize={44}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#547792" }} />
                <YAxis tick={{ fontSize: 12, fill: "#547792" }} unit=" min" />
                <Tooltip formatter={(v: number) => [`${v} min`, "Avg Delay"]} />
                <Bar dataKey="Avg Delay (min)" radius={[6, 6, 0, 0]}>
                  {delayBarData.map((d, i) => (
                    <Cell key={i} fill={d.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </section>

      {/* ── Pie + Radar ───────────────────────────────────────────────────── */}
      <section>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Cluster size pie */}
          <Card>
            <p className="mb-4 text-sm font-semibold text-navy">Passenger Distribution by Cluster</p>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={({ name, percent }) => `${name.split(" ")[0]} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {pieData.map((d, i) => (
                    <Cell key={i} fill={d.fill} />
                  ))}
                </Pie>
                <Legend iconType="circle" iconSize={10} />
                <Tooltip formatter={(v: number) => [v.toLocaleString(), "Passengers"]} />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          {/* Radar multi-axis */}
          <Card>
            <p className="mb-4 text-sm font-semibold text-navy">Cluster Multi-Dimension Radar</p>
            <p className="mb-3 text-xs text-steel">Delay capped at 50 min for visual clarity (C3 actual: 137 min)</p>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="cluster" tick={{ fontSize: 12, fill: "#547792" }} />
                <PolarRadiusAxis angle={30} tick={{ fontSize: 10, fill: "#547792" }} />
                <Radar name="Churn Risk %" dataKey="Churn Risk" stroke="#dc2626" fill="#dc2626" fillOpacity={0.15} />
                <Radar name="Avg Delay (capped)" dataKey="Avg Delay" stroke="#d97706" fill="#d97706" fillOpacity={0.15} />
                <Radar name="Size (k)" dataKey="Size (k)" stroke="#1A3263" fill="#1A3263" fillOpacity={0.15} />
                <Legend iconType="circle" iconSize={10} />
              </RadarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </section>

      {/* ── Model comparison table ────────────────────────────────────────── */}
      {models.length > 0 && (
        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-steel flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-gold" /> Model Comparison — Satisfaction Classifier
          </h2>
          <Card className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-100/70">
                  <th className="pb-2 pr-4 text-left text-xs font-semibold uppercase tracking-wider text-steel">Model</th>
                  {["accuracy", "balanced_acc", "precision", "recall", "f1", "roc_auc", "cv_f1_mean"].map((k) => (
                    <th key={k} className="pb-2 pr-3 text-right text-xs font-semibold uppercase tracking-wider text-steel">
                      {k.replace(/_/g, " ")}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {models.map((row, i) => (
                  <tr key={i} className={i === 0 ? "bg-brand-50/60" : ""}>
                    <td className="py-2 pr-4 font-medium text-navy">
                      {String(row.model)}
                      {i === 0 && (
                        <span className="ml-2 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-700 ring-1 ring-green-200">
                          Best
                        </span>
                      )}
                    </td>
                    {["accuracy", "balanced_acc", "precision", "recall", "f1", "roc_auc", "cv_f1_mean"].map((k) => (
                      <td key={k} className="py-2 pr-3 text-right tabular-nums text-slate-700">
                        {typeof row[k] === "number" ? (row[k] as number).toFixed(4) : "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </section>
      )}

      {/* ── High-risk customers table ─────────────────────────────────────── */}
      {highRisk.length > 0 && (
        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-steel flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-gold" /> Top 20 High-Risk Loyalty Members
          </h2>
          <Card className="overflow-x-auto">
            <p className="mb-4 text-sm text-steel">
              Customers with the highest predicted churn probability — candidates for immediate retention intervention.
            </p>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-100/70">
                  <th className="pb-2 pr-4 text-left text-xs font-semibold uppercase tracking-wider text-steel">#</th>
                  <th className="pb-2 pr-4 text-left text-xs font-semibold uppercase tracking-wider text-steel">Loyalty #</th>
                  <th className="pb-2 pr-4 text-left text-xs font-semibold uppercase tracking-wider text-steel">Date</th>
                  <th className="pb-2 pr-4 text-right text-xs font-semibold uppercase tracking-wider text-steel">Churn Probability</th>
                  <th className="pb-2 text-right text-xs font-semibold uppercase tracking-wider text-steel">Status</th>
                </tr>
              </thead>
              <tbody>
                {highRisk.map((row, i) => (
                  <tr key={i} className="border-b border-brand-100/30 last:border-0">
                    <td className="py-2 pr-4 text-steel">{i + 1}</td>
                    <td className="py-2 pr-4 font-mono text-navy">{String(row.loyalty_number)}</td>
                    <td className="py-2 pr-4 text-slate-600">{row.date}</td>
                    <td className="py-2 pr-4 text-right">
                      <span className="inline-block rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700 ring-1 ring-red-200 tabular-nums">
                        {(row.churn_probability * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td className="py-2 text-right">
                      <span className="inline-block rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700 ring-1 ring-red-200">
                        High Risk
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </section>
      )}
    </div>
  );
}
