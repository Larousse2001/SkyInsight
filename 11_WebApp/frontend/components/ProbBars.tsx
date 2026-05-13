"use client";

export function ProbBars({ probs }: { probs: Record<string, number> }) {
  const entries = Object.entries(probs);
  return (
    <div className="mt-4 space-y-2">
      {entries.map(([k, v]) => (
        <div key={k}>
          <div className="flex items-center justify-between text-xs font-medium text-slate-600">
            <span>{k}</span>
            <span>{(v * 100).toFixed(1)}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-500 to-indigo-600"
              style={{ width: `${Math.max(0, Math.min(100, v * 100))}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
