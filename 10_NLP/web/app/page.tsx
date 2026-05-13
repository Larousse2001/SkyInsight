import { api, Stats, Distributions } from "@/lib/api";
import { StatCard } from "@/components/stat-card";
import { Card, CardTitle } from "@/components/card";
import { SentimentBar } from "@/components/sentiment-bar";
import { Histogram } from "@/components/histogram";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  let stats: Stats | null = null;
  let dist: Distributions | null = null;
  let error: string | null = null;
  try {
    [stats, dist] = await Promise.all([
      api<Stats>("/stats"),
      api<Distributions>("/distributions"),
    ]);
  } catch (e: any) {
    error = e.message;
  }

  if (error || !stats || !dist) {
    return (
      <div className="space-y-6">
        <Header />
        <Card>
          <div className="text-danger">
            Cannot reach API at <code>{process.env.NEXT_PUBLIC_API_BASE}</code>.
            <br />
            Start the backend: <code>uvicorn 10_NLP.app.api:app --reload --port 8000</code>
          </div>
          {error && <pre className="mt-2 text-xs text-muted">{error}</pre>}
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Header />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Reviews" value={stats.total_reviews.toLocaleString()} accent="accent" />
        <StatCard label="Positive" value={`${stats.positive_pct}%`} accent="success" />
        <StatCard label="Negative" value={`${stats.negative_pct}%`} accent="danger" />
        <StatCard label="Topics Discovered" value={stats.n_topics} accent="warning" />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle>VADER Sentiment</CardTitle>
          <SentimentBar data={dist.vader} />
        </Card>
        <Card>
          <CardTitle>DistilBERT Sentiment</CardTitle>
          <SentimentBar data={dist.bert} />
        </Card>
        <Card>
          <CardTitle>VADER Compound Score Distribution</CardTitle>
          <Histogram data={dist.vader_histogram} />
        </Card>
        <Card>
          <CardTitle>Topic Distribution</CardTitle>
          <SentimentBar data={dist.topics as any} labelKey="topic_id" />
        </Card>
      </section>
    </div>
  );
}

function Header() {
  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">Overview</h1>
      <p className="mt-1 text-sm text-muted">
        Sentiment, topics, and entity insights from airline reviews.
      </p>
    </div>
  );
}
