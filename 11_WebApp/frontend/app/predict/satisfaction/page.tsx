"use client";

import { useState } from "react";
import { Card, SectionTitle } from "@/components/ui";
import { ProbBars } from "@/components/ProbBars";
import { apiPostJson } from "@/lib/api";
import { Loader2 } from "lucide-react";

type Form = {
  gender: "Male" | "Female";
  age: number;
  customer_type: "First-time" | "Returning";
  type_of_travel: "Business" | "Personal";
  class: "Business" | "Economy" | "Economy Plus";
  flight_distance: number;
  departure_delay: number;
  arrival_delay: number;
  departure_and_arrival_time_convenience: number;
  ease_of_online_booking: number;
  checkin_service: number;
  online_boarding: number;
  gate_location: number;
  onboard_service: number;
  seat_comfort: number;
  leg_room_service: number;
  cleanliness: number;
  food_and_drink: number;
  inflight_service: number;
  inflight_wifi_service: number;
  inflight_entertainment: number;
  baggage_handling: number;
};

type Result = { label: string; confidence: number; probabilities: Record<string, number> };

const DEFAULT: Form = {
  gender: "Male", age: 40, customer_type: "Returning", type_of_travel: "Business", class: "Business",
  flight_distance: 1500, departure_delay: 5, arrival_delay: 5,
  departure_and_arrival_time_convenience: 4, ease_of_online_booking: 4, checkin_service: 4,
  online_boarding: 4, gate_location: 4, onboard_service: 4, seat_comfort: 4, leg_room_service: 4,
  cleanliness: 4, food_and_drink: 4, inflight_service: 4, inflight_wifi_service: 4,
  inflight_entertainment: 4, baggage_handling: 4,
};

const RATINGS: (keyof Form)[] = [
  "online_boarding", "inflight_wifi_service", "inflight_entertainment", "seat_comfort",
  "ease_of_online_booking", "leg_room_service", "onboard_service", "cleanliness",
  "checkin_service", "baggage_handling", "inflight_service",
  "departure_and_arrival_time_convenience", "gate_location", "food_and_drink",
];

export default function SatisfactionPage() {
  const [form, setForm] = useState<Form>(DEFAULT);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null); setResult(null);
    try {
      const r = await apiPostJson<Result>("/api/predict/satisfaction", form);
      setResult(r);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SectionTitle eyebrow="Live inference" title="Customer Satisfaction" subtitle="XGBoost classifier (96.6% accuracy) on flight experience signals." />
      <form onSubmit={submit} className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h3 className="text-base font-semibold text-slate-900">Passenger & flight</h3>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Select label="Gender" value={form.gender} onChange={(v) => set("gender", v as Form["gender"])} options={["Male", "Female"]} />
            <Select label="Customer type" value={form.customer_type} onChange={(v) => set("customer_type", v as Form["customer_type"])} options={["Returning", "First-time"]} />
            <Select label="Type of travel" value={form.type_of_travel} onChange={(v) => set("type_of_travel", v as Form["type_of_travel"])} options={["Business", "Personal"]} />
            <Select label="Class" value={form.class} onChange={(v) => set("class", v as Form["class"])} options={["Business", "Economy", "Economy Plus"]} />
            <NumberField label="Age" value={form.age} onChange={(v) => set("age", v)} min={7} max={100} />
            <NumberField label="Flight distance" value={form.flight_distance} onChange={(v) => set("flight_distance", v)} min={0} max={10000} />
            <NumberField label="Departure delay (min)" value={form.departure_delay} onChange={(v) => set("departure_delay", v)} min={0} />
            <NumberField label="Arrival delay (min)" value={form.arrival_delay} onChange={(v) => set("arrival_delay", v)} min={0} />
          </div>

          <h3 className="mt-8 text-base font-semibold text-slate-900">Experience ratings (0–5)</h3>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {RATINGS.map((k) => (
              <Rating key={k} label={prettify(k)} value={form[k] as number} onChange={(v) => set(k, v as Form[typeof k])} max={k === "baggage_handling" ? 5 : 5} min={k === "baggage_handling" ? 1 : 0} />
            ))}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-slate-800 disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />} Run prediction
          </button>
        </Card>

        <Card>
          <h3 className="text-base font-semibold text-slate-900">Result</h3>
          {error && <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          {!result && !error && <p className="mt-3 text-sm text-slate-500">Submit to see a prediction.</p>}
          {result && (
            <>
              <div className="mt-3">
                <p className="text-xs uppercase tracking-wider text-slate-500">Prediction</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{result.label}</p>
                <p className="text-sm text-slate-500">Confidence {(result.confidence * 100).toFixed(1)}%</p>
              </div>
              <ProbBars probs={result.probabilities} />
            </>
          )}
        </Card>
      </form>
    </>
  );
}

function prettify(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-slate-600">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border-slate-200 bg-white px-3 py-2 text-sm shadow-sm ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
      >
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}

function NumberField({ label, value, onChange, min, max }: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-slate-600">{label}</span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full rounded-lg border-slate-200 bg-white px-3 py-2 text-sm shadow-sm ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
      />
    </label>
  );
}

function Rating({ label, value, onChange, min = 0, max = 5 }: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  return (
    <label className="block">
      <span className="flex items-center justify-between text-xs font-medium text-slate-600">
        <span>{label}</span>
        <span className="text-slate-900 font-semibold">{value}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full accent-brand-600"
      />
    </label>
  );
}
