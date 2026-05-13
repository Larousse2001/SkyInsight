"use client";

import { useEffect, useState } from "react";
import { CLIENT_API_BASE, ReviewsResponse } from "@/lib/api";
import { Card } from "@/components/card";
import { Badge } from "@/components/badge";
import { Search, Loader2, ChevronLeft, ChevronRight } from "lucide-react";

export default function ReviewsPage() {
  const [data, setData] = useState<ReviewsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [sentiment, setSentiment] = useState("");

  async function load() {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      page_size: "20",
    });
    if (q) params.set("q", q);
    if (sentiment) params.set("sentiment", sentiment);
    try {
      const res = await fetch(`${CLIENT_API_BASE}/reviews?${params.toString()}`);
      setData(await res.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, sentiment]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.page_size)) : 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Reviews</h1>
        <p className="mt-1 text-sm text-muted">
          Browse and filter the full reviews dataset.
        </p>
      </div>

      <Card>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (setPage(1), load())}
              placeholder="Search text..."
              className="w-full rounded-lg border border-border bg-background/60 py-2 pl-10 pr-3 text-sm outline-none focus:border-accent"
            />
          </div>
          <select
            value={sentiment}
            onChange={(e) => {
              setSentiment(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-border bg-background/60 px-3 py-2 text-sm outline-none focus:border-accent"
          >
            <option value="">All sentiments</option>
            <option value="positive">Positive</option>
            <option value="neutral">Neutral</option>
            <option value="negative">Negative</option>
          </select>
          <button
            onClick={() => {
              setPage(1);
              load();
            }}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90"
          >
            Search
          </button>
        </div>
      </Card>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted" />
        </div>
      ) : data ? (
        <>
          <div className="space-y-3">
            {data.items.map((r, i) => (
              <Card key={i} className="!p-4">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Badge variant="sentiment">{r.sent_vader_label}</Badge>
                  <Badge variant="sentiment">{r.sent_bert_label}</Badge>
                  {r.topic_id !== "" && <Badge>Topic #{r.topic_id}</Badge>}
                  <span className="ml-auto font-mono text-[10px] text-muted">
                    VADER {Number(r.sent_vader).toFixed(2)} · BERT{" "}
                    {Number(r.sent_bert_score).toFixed(2)}
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-white/90">
                  {r.text_clean.slice(0, 400)}
                  {r.text_clean.length > 400 ? "…" : ""}
                </p>
              </Card>
            ))}
          </div>

          <div className="flex items-center justify-between pt-4">
            <span className="text-xs text-muted">
              Page {data.page} of {totalPages} · {data.total.toLocaleString()} reviews
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-lg border border-border bg-white/5 p-2 disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-border bg-white/5 p-2 disabled:opacity-30"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
