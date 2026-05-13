import { Card, SectionTitle, StatBadge } from "@/components/ui";

type Summary = {
  projects: { id: string; title: string; category: string; tagline: string; metric: { label: string; value: string }; icon: string }[];
  satisfaction_metrics: Record<string, number>;
  route_models: { regression: Record<string, number>; classification: Record<string, number>; shap: Record<string, number> };
  co2: { last_value?: number; model?: string };
};

async function getSummary(): Promise<Summary> {
  const r = await fetch("http://localhost:8000/api/reports/summary", { cache: "no-store" });
  if (!r.ok) throw new Error("Failed to load summary");
  return r.json();
}

async function getHighRisk(): Promise<{ columns: string[]; rows: Record<string, unknown>[] }> {
  const r = await fetch("http://localhost:8000/api/reports/high-risk-customers", { cache: "no-store" });
  if (!r.ok) return { columns: [], rows: [] };
  return r.json();
}

export default async function DashboardPage() {
  let summary: Summary | null = null;
  let risk: { columns: string[]; rows: Record<string, unknown>[] } = { columns: [], rows: [] };
  let error: string | null = null;
  try {
    [summary, risk] = await Promise.all([getSummary(), getHighRisk()]);
  } catch (e) {
    error = (e as Error).message;
  }

  if (error || !summary) {
    return (
      <Card>
        <SectionTitle eyebrow="Dashboard" title="Backend offline" />
        <p className="text-slate-600">
          Could not reach the FastAPI backend at <code className="rounded bg-slate-100 px-1 py-0.5">localhost:8000</code>.
          Start it with <code className="rounded bg-slate-100 px-1 py-0.5">uvicorn app.main:app --reload --port 8000</code>.
        </p>
      </Card>
    );
  }

  const m = summary.satisfaction_metrics;
  const reg = summary.route_models.regression;
  const cls = summary.route_models.classification;
  const shapTop = Object.entries(summary.route_models.shap).slice(0, 6);

  return (
    <>
      <SectionTitle eyebrow="Executive view" title="SkyInsight Dashboard" subtitle="Aggregated metrics from every model in 09_Reports." />

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {summary.projects.map((p) => (
          <Card key={p.id}>
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">{p.category}</p>
            <h3 className="mt-1 text-lg font-semibold text-slate-900">{p.title}</h3>
            <p className="mt-1 text-sm text-slate-600">{p.tagline}</p>
            <div className="mt-4">
              <StatBadge label={p.metric.label} value={p.metric.value} />
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="text-lg font-semibold text-slate-900">Satisfaction model — test metrics</h3>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Object.entries(m).map(([k, v]) => (
              <StatBadge key={k} label={k} value={(v as number).toFixed(3)} />
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-slate-900">Route profitability — best models</h3>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <StatBadge label={`Reg: ${reg.Model ?? "—"}`} value={`R² ${(reg["Test R²"] as number)?.toFixed(3) ?? "—"}`} />
            <StatBadge label={`Cls: ${cls.Model ?? "—"}`} value={`AUC ${(cls["ROC-AUC"] as number)?.toFixed(3) ?? "—"}`} />
          </div>
          <div className="mt-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Top SHAP drivers</p>
            <ul className="space-y-1.5 text-sm">
              {shapTop.map(([k, v]) => (
                <li key={k} className="flex items-center justify-between">
                  <span className="text-slate-700">{k}</span>
                  <span className="font-mono text-slate-500">{(v as number).toFixed(2)}</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </div>

      <div className="mt-10">
        <Card>
          <h3 className="text-lg font-semibold text-slate-900">Top 20 high-risk customers (churn)</h3>
          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  {risk.columns.map((c) => (
                    <th key={c} className="px-3 py-2 text-left font-semibold">{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {risk.rows.slice(0, 20).map((row, i) => (
                  <tr key={i} className="border-t border-slate-100">
                    {risk.columns.map((c) => (
                      <td key={c} className="px-3 py-1.5 text-slate-700 whitespace-nowrap">
                        {String(row[c] ?? "")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </>
  );
}
