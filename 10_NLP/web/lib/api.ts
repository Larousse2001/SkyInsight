// Used by Server Components (RSC) — direct server-to-server, no CORS
export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

// Used by Client Components — routes through Next.js rewrite proxy
// (/api/* → http://localhost:8000/*), so the browser never makes a
// cross-origin request and no CORS header is required.
export const CLIENT_API_BASE = "/api";

export async function api<T>(
  path: string,
  init?: RequestInit & { revalidate?: number },
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...init,
    next: { revalidate: init?.revalidate ?? 30 },
  });
  if (!res.ok) {
    throw new Error(`API ${path} failed: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export type Stats = {
  total_reviews: number;
  positive_pct: number;
  negative_pct: number;
  n_topics: number;
  vader_counts: Record<string, number>;
  bert_counts: Record<string, number>;
  summary: Record<string, unknown>;
};

export type Distributions = {
  vader: { label: string; count: number }[];
  bert: { label: string; count: number }[];
  topics: { topic_id: number; count: number }[];
  vader_histogram: { bin: string; left: number; right: number; count: number }[];
};

export type Topic = { topic_id: number; top_terms: string };

export type Entity = { entity: string; count: number; text: string; label: string };

export type Review = {
  text_clean: string;
  sent_vader_label: string;
  sent_vader: number;
  sent_bert_label: string;
  sent_bert_score: number;
  topic_id: number | string;
  entities: string;
};

export type ReviewsResponse = {
  total: number;
  page: number;
  page_size: number;
  items: Review[];
};

export type SentimentResult = {
  text: string;
  vader: { label: string; compound: number; pos: number; neg: number; neu: number };
  distilbert: { label: string; score: number };
};
