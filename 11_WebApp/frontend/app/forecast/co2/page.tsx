"use client";

import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from "recharts";
import { Card, SectionTitle } from "@/components/ui";

type Forecast = { columns: string[]; rows: Record<string, number>[] };

export default function Co2Page() {
  const [data, setData] = useState<Forecast | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/reports/co2-forecast")
      .then((r) => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))
      .then(setData)
      .catch((e: Error) => setError(e.message));
  }, []);

  return (
    <>
      <SectionTitle eyebrow="Time series" title="CO₂ Emissions Forecast" subtitle="Annual fleet CO₂ predictions across Linear Regression, Random Forest, XGBoost and LightGBM." />

      {error && <Card><p className="text-red-700">{error}</p></Card>}

      {data && (
        <Card>
          <div className="h-96 w-full">
            <ResponsiveContainer>
              <LineChart data={data.rows}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="Year" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => (v / 1e6).toFixed(0) + "M"} />
                <Tooltip formatter={(v: number) => v.toLocaleString(undefined, { maximumFractionDigits: 0 })} />
                <Legend />
                {data.columns.filter((c) => c !== "Year").map((c, i) => (
                  <Line key={c} type="monotone" dataKey={c} stroke={["#2563eb", "#10b981", "#f59e0b", "#ef4444"][i % 4]} strokeWidth={2} dot={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>{data.columns.map((c) => <th key={c} className="px-3 py-2 text-left font-semibold">{c}</th>)}</tr>
              </thead>
              <tbody>
                {data.rows.map((row, i) => (
                  <tr key={i} className="border-t border-slate-100">
                    {data.columns.map((c) => (
                      <td key={c} className="px-3 py-1.5 text-slate-700 whitespace-nowrap">
                        {typeof row[c] === "number" ? (row[c] as number).toLocaleString(undefined, { maximumFractionDigits: 0 }) : String(row[c])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  );
}
