"use client";

import { useState } from "react";
import Image from "next/image";
import { Loader2, Upload } from "lucide-react";
import clsx from "clsx";
import { Card, SectionTitle } from "@/components/ui";
import { ProbBars } from "@/components/ProbBars";
import { apiPostFile } from "@/lib/api";

const TASKS = [
  { id: "cabin",   label: "Cabin Cleanliness", desc: "Detect Clean vs Dirty cabins." },
  { id: "crowd",   label: "Terminal Crowd",    desc: "Estimate crowd density level." },
  { id: "luggage", label: "Luggage Damage",    desc: "Spot damaged vs good luggage." },
];

type Result = { task: string; label: string; confidence: number; probabilities: Record<string, number> };

export default function CnnPage() {
  const [task, setTask] = useState<string>("cabin");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onFile = (f: File | null) => {
    setFile(f);
    setResult(null); setError(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(f ? URL.createObjectURL(f) : null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const r = await apiPostFile<Result>(`/api/predict/cnn/${task}`, file);
      setResult(r);
    } catch (err) {
      setError((err as Error).message);
    } finally { setLoading(false); }
  };

  return (
    <>
      <SectionTitle eyebrow="Computer vision" title="Cabin · Crowd · Luggage" subtitle="EfficientNetV2S backbone with TTA + temperature-scaled probabilities." />

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {TASKS.map((t) => (
          <button
            key={t.id}
            onClick={() => { setTask(t.id); setResult(null); }}
            className={clsx(
              "rounded-2xl border p-4 text-left transition-all",
              task === t.id
                ? "border-brand-500 bg-brand-50 ring-2 ring-brand-200"
                : "border-slate-200 bg-white/70 hover:border-slate-300"
            )}
          >
            <p className="text-sm font-semibold text-slate-900">{t.label}</p>
            <p className="mt-1 text-xs text-slate-600">{t.desc}</p>
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <label
            htmlFor="file"
            className="flex h-72 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/60 hover:bg-slate-50"
          >
            {preview ? (
              <Image src={preview} alt="preview" width={420} height={280} className="max-h-64 w-auto rounded-xl object-contain" unoptimized />
            ) : (
              <div className="text-center">
                <Upload className="mx-auto h-8 w-8 text-slate-400" />
                <p className="mt-2 text-sm text-slate-600">Click to upload an image (JPG/PNG)</p>
              </div>
            )}
            <input
              id="file"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onFile(e.target.files?.[0] ?? null)}
            />
          </label>
          <button
            type="submit"
            disabled={!file || loading}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-slate-800 disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />} Classify image
          </button>
        </Card>

        <Card>
          <h3 className="text-base font-semibold text-slate-900">Result</h3>
          {error && <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          {!result && !error && <p className="mt-3 text-sm text-slate-500">Upload an image and run.</p>}
          {result && (
            <>
              <p className="mt-3 text-xs uppercase tracking-wider text-slate-500">{result.task}</p>
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
