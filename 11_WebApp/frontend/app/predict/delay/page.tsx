"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Card, SectionTitle } from "@/components/ui";
import { ProbBars } from "@/components/ProbBars";
import { apiPostJson } from "@/lib/api";

const FIELDS: { key: string; label: string; def: number }[] = [
  { key: "year", label: "Year", def: 2026 },
  { key: "month", label: "Month", def: 6 },
  { key: "arr_flights", label: "Arr flights", def: 200 },
  { key: "arr_del15", label: "Arr del15", def: 40 },
  { key: "carrier_ct", label: "Carrier ct", def: 10 },
  { key: "weather_ct", label: "Weather ct", def: 2 },
  { key: "nas_ct", label: "NAS ct", def: 8 },
  { key: "security_ct", label: "Security ct", def: 0 },
  { key: "late_aircraft_ct", label: "Late aircraft ct", def: 15 },
  { key: "arr_cancelled", label: "Cancelled", def: 1 },
  { key: "arr_diverted", label: "Diverted", def: 0 },
  { key: "arr_delay", label: "Total arr delay (min)", def: 1200 },
  { key: "carrier_delay", label: "Carrier delay", def: 500 },
  { key: "weather_delay", label: "Weather delay", def: 100 },
  { key: "nas_delay", label: "NAS delay", def: 300 },
  { key: "security_delay", label: "Security delay", def: 0 },
  { key: "late_aircraft_delay", label: "Late aircraft delay", def: 600 },
];

type Result = { label: string; confidence: number; probabilities: Record<string, number> };

export default function DelayPage() {
  const [form, setForm] = useState<Record<string, number>>(
    Object.fromEntries(FIELDS.map((f) => [f.key, f.def]))
  );
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null); setResult(null);
    try {
      const r = await apiPostJson<Result>("/api/predict/delay", form);
      setResult(r);
    } catch (err) {
      setError((err as Error).message);
    } finally { setLoading(false); }
  };

  return (
    <>
      <SectionTitle eyebrow="Live inference" title="Flight Delay Predictor" subtitle="Deep neural network trained on US BTS delay-cause statistics." />
      <form onSubmit={submit} className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {FIELDS.map((f) => (
              <label key={f.key} className="block">
                <span className="block text-xs font-medium text-slate-600">{f.label}</span>
                <input
                  type="number"
                  value={form[f.key]}
                  onChange={(e) => setForm({ ...form, [f.key]: Number(e.target.value) })}
                  className="mt-1 w-full rounded-lg bg-white px-3 py-2 text-sm shadow-sm ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </label>
            ))}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-slate-800 disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />} Predict delay
          </button>
        </Card>
        <Card>
          <h3 className="text-base font-semibold text-slate-900">Result</h3>
          {error && <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          {!result && !error && <p className="mt-3 text-sm text-slate-500">Submit to see a prediction.</p>}
          {result && (
            <>
              <p className="mt-3 text-xs uppercase tracking-wider text-slate-500">Prediction</p>
              <p className="text-2xl font-bold text-slate-900">{result.label}</p>
              <p className="text-sm text-slate-500">Confidence {(result.confidence * 100).toFixed(1)}%</p>
              <ProbBars probs={result.probabilities} />
            </>
          )}
        </Card>
      </form>
    </>
  );
}
