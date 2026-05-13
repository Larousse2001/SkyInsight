"use client";

import { useState } from "react";
import { Card, CardTitle } from "@/components/card";
import { Badge } from "@/components/badge";
import { CLIENT_API_BASE, SentimentResult } from "@/lib/api";
import { Sparkles, Loader2 } from "lucide-react";

export default function AnalyzePage() {
  const [text, setText] = useState(
    "The cabin crew was rude and our flight was delayed by 4 hours.",
  );
  const [result, setResult] = useState<SentimentResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setErr(null);
    setResult(null);
    try {
      const res = await fetch(`${CLIENT_API_BASE}/sentiment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error(await res.text());
      setResult(await res.json());
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Real-Time Analysis</h1>
        <p className="mt-1 text-sm text-muted">
          Send any text to the live VADER + DistilBERT models.
        </p>
      </div>

      <Card>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          className="w-full resize-none rounded-xl border border-border bg-background/50 p-4 text-sm outline-none placeholder:text-muted focus:border-accent"
          placeholder="Paste an airline review..."
        />
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={run}
            disabled={loading || !text.trim()}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white shadow-glow transition hover:bg-accent/90 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Analyze
          </button>
          <span className="text-xs text-muted">{text.length} chars</span>
        </div>
        {err && <div className="mt-4 text-sm text-danger">{err}</div>}
      </Card>

      {result && (
        <section className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardTitle>VADER (lexicon-based)</CardTitle>
            <Badge variant="sentiment">{result.vader.label}</Badge>
            <div className="mt-4 space-y-2 text-sm">
              <Row label="Compound" value={result.vader.compound.toFixed(3)} />
              <Row label="Positive" value={result.vader.pos.toFixed(3)} />
              <Row label="Negative" value={result.vader.neg.toFixed(3)} />
              <Row label="Neutral" value={result.vader.neu.toFixed(3)} />
            </div>
          </Card>
          <Card>
            <CardTitle>DistilBERT (neural)</CardTitle>
            <Badge variant="sentiment">{result.distilbert.label.toLowerCase()}</Badge>
            <div className="mt-4 space-y-2 text-sm">
              <Row label="Confidence" value={`${(result.distilbert.score * 100).toFixed(1)}%`} />
            </div>
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full bg-accent2 transition-all"
                style={{ width: `${result.distilbert.score * 100}%` }}
              />
            </div>
          </Card>
        </section>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/50 py-1.5">
      <span className="text-muted">{label}</span>
      <span className="font-mono text-white">{value}</span>
    </div>
  );
}
