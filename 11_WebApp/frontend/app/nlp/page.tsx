"use client";

import { Card, Pill, SectionTitle, StatCard } from "@/components/ui";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  MessageSquare, Smile, Frown, Hash, Tags, Search, Sparkles, Loader2,
  Lightbulb, AlertTriangle, TrendingUp, Target, Clock, Rocket,
  Cloud, Plane, Star, AlignLeft,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

// ── API helpers ──────────────────────────────────────────────────────────────
const NLP = "/api/nlp"; // proxied to localhost:8001 by next.config.mjs

async function jget<T>(path: string): Promise<T> {
  const r = await fetch(`${NLP}${path}`, { cache: "no-store" });
  if (!r.ok) throw new Error(`${path} → ${r.status}`);
  return r.json();
}

// ── Types (loose) ────────────────────────────────────────────────────────────
type Stats = {
  total_reviews: number;
  positive_pct: number;
  negative_pct: number;
  n_topics: number;
  vader_counts: Record<string, number>;
  bert_counts: Record<string, number>;
};
type Distributions = {
  vader: { label: string; count: number }[];
  bert: { label: string; count: number }[];
  topics: { topic_id: number; count: number; topic_label?: string }[];
  vader_histogram: { bin: string; left: number; right: number; count: number }[];
};
type Topic = { topic_id: number; topic_label?: string; top_words?: string; top_terms?: string };
type Entity = { entity?: string; text?: string; label: string; count: number };
type Review = {
  text_clean: string;
  sent_vader_label?: string;
  sent_vader?: number;
  sent_bert_label?: string;
  sent_bert_score?: number;
  topic_id?: number;
  topic_label?: string;
  entities?: string;
};
type Baseline = {
  available: boolean;
  message?: string;
  models?: string[];
  best_model?: string;
  label_source?: string;
  results?: Record<string, { accuracy: number; macro_f1: number; cv_f1_macro_mean?: number; cv_f1_macro_std?: number }>;
  smote?: {
    k_neighbors: number;
    train_before: Record<string, number>;
    train_after: Record<string, number>;
  };
  n_features?: number;
  n_train?: number;
  n_test?: number;
};
type AspectRow = { topic_label: string; sent_bert_label: string; count: number };
type AspectResponse = { available: boolean; items: AspectRow[] };
type TimeseriesRow = { date: string; topic_label: string; count: number; neg: number; neg_share: number };
type TimeseriesResponse = { available: boolean; items: TimeseriesRow[] };
type WordCloudItem = { text: string; value: number };
type WordCloudResponse = { available: boolean; n_reviews: number; source_column: string; items: WordCloudItem[] };
type AirlineStatRow = {
  airline: string; count: number; avg_rating: number | null;
  vader_positive: number; vader_neutral: number; vader_negative: number;
  bert_positive: number; bert_negative: number;
};
type AirlineStatsResponse = { available: boolean; items: AirlineStatRow[] };
type RatingDistResponse = { available: boolean; mean?: number; median?: number; items: { label: string; count: number }[] };
type LengthDistResponse = { available: boolean; mean?: number; median?: number; items: { label: string; count: number }[] };

const COLORS = ["#1A3263", "#547792", "#FFC570", "#EFD2B0", "#3F5E78", "#28456A", "#FFD693"];

// ── Business theme classifier (keyword-based) ────────────────────────────────
type Theme = {
  key: string;
  label: string;
  tone: "pain" | "neutral" | "praise";
  keywords: string[];
};

const THEMES: Theme[] = [
  { key: "ops",      label: "Operational reliability (delays & cancellations)", tone: "pain",
    keywords: ["delay", "delayed", "cancel", "cancellation", "hours", "gate", "told", "wait"] },
  { key: "baggage",  label: "Baggage handling",                                  tone: "pain",
    keywords: ["baggage", "luggage", "bag", "carry"] },
  { key: "policy",   label: "Pricing, refunds & change policy",                  tone: "pain",
    keywords: ["policy", "refund", "ticket", "change", "money", "price", "cancellation"] },
  { key: "cabin",    label: "Cabin comfort & cleanliness",                       tone: "neutral",
    keywords: ["seat", "seats", "cabin", "legroom", "leg", "comfort", "cleanliness", "clean"] },
  { key: "food",     label: "Food & beverage",                                   tone: "neutral",
    keywords: ["food", "drink", "meal"] },
  { key: "crew",     label: "Crew & onboard service",                            tone: "praise",
    keywords: ["crew", "staff", "service", "friendly"] },
  { key: "digital",  label: "Digital booking & check-in",                        tone: "neutral",
    keywords: ["booking", "online", "check", "checkin", "app", "website"] },
  { key: "loyalty",  label: "Loyalty & rewards",                                 tone: "praise",
    keywords: ["points", "loyalty", "miles", "reward"] },
  { key: "ife",      label: "Wi-Fi & in-flight entertainment",                   tone: "neutral",
    keywords: ["wifi", "wi-fi", "entertainment", "screen"] },
];

function classifyTopic(words: string): Theme | null {
  const w = words.toLowerCase();
  let best: { theme: Theme; hits: number } | null = null;
  for (const th of THEMES) {
    const hits = th.keywords.reduce((acc, kw) => acc + (w.includes(kw) ? 1 : 0), 0);
    if (hits > 0 && (!best || hits > best.hits)) best = { theme: th, hits };
  }
  return best?.theme ?? null;
}

type AnalysisShape = {
  themesRanked: { theme: Theme; volume: number; topicIds: number[] }[];
  painThemes:   { theme: Theme; volume: number; topicIds: number[] }[];
  praiseThemes: { theme: Theme; volume: number; topicIds: number[] }[];
  orgs: string[];
  sentimentGap: number;
  vaderNegPct: number;
  bertNegPct: number;
  vaderPos: number;
  bertPos: number;
  total: number;
};

const PLAYBOOK_SHORT: Record<string, string> = {
  ops:     "Stand up a delay war-room: real-time gate alerts + automatic rebooking SMS within 15 min of a >60 min delay.",
  baggage: "Roll out bag-tag tracking notifications and same-day reimbursement for delayed luggage at top-10 hubs.",
  policy:  "Publish a one-page plain-language refund policy and train front-line agents on a 24-hour resolution SLA.",
  cabin:   "Tighten turnaround cleaning checklists; audit 20% of flights weekly with photo evidence.",
  food:    "Re-tender catering on the worst-rated 5 routes and add a vegetarian + halal option fleet-wide.",
  crew:    "Launch a monthly “Crew Hero” bonus funded by positive review mentions captured in this pipeline.",
  digital: "Fix the top-3 friction points in online check-in flagged by users; add a status banner during outages.",
  loyalty: "Send a 2× points booster to detractors flagged as POSITIVE on BERT but NEUTRAL on VADER (silent advocates).",
  ife:     "Negotiate a Wi-Fi SLA refund credit for outages > 30 min on long-haul flights.",
};

const PLAYBOOK_LONG: Record<string, string> = {
  ops:     "Invest in predictive delay ML (already built in SkyInsight) to pre-position crews and aircraft — target a 25% on-time uplift.",
  baggage: "Deploy RFID baggage tracking fleet-wide and integrate with the mobile app as a paid premium feature.",
  policy:  "Move to a tier-based fare family with transparent fees; A/B test against current structure for NPS uplift.",
  cabin:   "Refresh seat product on the oldest 30% of the fleet; benchmark legroom against the named competitors below.",
  food:    "Build a regional menu program with local chefs on hub routes — strong marketing + review-driver lever.",
  crew:    "Codify the crew service playbook into a training academy; tie promotion path to review-mention frequency.",
  digital: "Rebuild the booking funnel with one-screen checkout; integrate WhatsApp / chatbot for disruption support.",
  loyalty: "Launch lifestyle-partner redemptions (hotels, retail) — turn miles into a daily-use currency.",
  ife:     "Equip long-haul fleet with high-bandwidth LEO satellite Wi-Fi; sell as a premium tier with free tier for elites.",
};

function buildShortTerm(a: AnalysisShape): string[] {
  const out: string[] = [];

  // 1) Sentiment-gap triage
  if (a.sentimentGap > 8) {
    out.push(
      `Sentiment gap is ${a.sentimentGap.toFixed(0)} pts — route DistilBERT-negative / VADER-non-negative reviews to a human triage queue: these are nuanced complaints that the keyword engine misses.`
    );
  }
  if (a.bertNegPct > 50) {
    out.push(
      `Majority (${a.bertNegPct.toFixed(0)}%) of reviews skew negative on the transformer model — set a daily executive briefing on the top-3 pain themes until below 35%.`
    );
  }

  // 2) Top 3 pain themes → tactical actions
  a.painThemes.slice(0, 3).forEach((p) => {
    const tip = PLAYBOOK_SHORT[p.theme.key];
    if (tip) out.push(`${p.theme.label}: ${tip}`);
  });

  // 3) Praise reinforcement
  if (a.praiseThemes.length > 0) {
    const top = a.praiseThemes[0];
    const tip = PLAYBOOK_SHORT[top.theme.key];
    if (tip) out.push(`Amplify what's working — ${top.theme.label.toLowerCase()}: ${tip}`);
  }

  // 4) Competitive listening
  if (a.orgs.length > 0) {
    out.push(
      `Benchmark vs. mentioned brands (${a.orgs.slice(0, 3).join(", ")}): scrape their reviews monthly and feed them through the same NLP pipeline for share-of-voice.`
    );
  }

  if (out.length === 0) {
    out.push("Maintain monitoring — sentiment and topic distributions are within healthy bands.");
  }
  return out;
}

function buildLongTerm(a: AnalysisShape): string[] {
  const out: string[] = [];

  // Tie long-term plays to the same pain themes
  a.painThemes.slice(0, 3).forEach((p) => {
    const tip = PLAYBOOK_LONG[p.theme.key];
    if (tip) out.push(`${p.theme.label}: ${tip}`);
  });

  // Praise → moat building
  a.praiseThemes.slice(0, 2).forEach((p) => {
    const tip = PLAYBOOK_LONG[p.theme.key];
    if (tip) out.push(`Defend the moat — ${p.theme.label.toLowerCase()}: ${tip}`);
  });

  // Strategic asks tied to platform itself
  out.push(
    "Wire this NLP pipeline into the CRM: every detractor review auto-creates a recovery ticket with the right team based on its detected theme."
  );
  out.push(
    "Move from review-listening to review-prevention: feed topic trends into the Power BI exec dashboard with a 4-week early-warning threshold per theme."
  );

  return out;
}

// ── Aspect heatmap + time-series components ─────────────────────────────────
function AspectHeatmap({ items }: { items: { topic_label: string; sent_bert_label: string; count: number }[] }) {
  const topicSet = Array.from(new Set(items.map((i) => i.topic_label))).filter(Boolean);
  const sentSet  = Array.from(new Set(items.map((i) => i.sent_bert_label))).filter(Boolean);
  const matrix: Record<string, Record<string, number>> = {};
  const rowTotals: Record<string, number> = {};
  topicSet.forEach((t) => { matrix[t] = {}; rowTotals[t] = 0; });
  items.forEach((it) => {
    matrix[it.topic_label][it.sent_bert_label] = (matrix[it.topic_label][it.sent_bert_label] || 0) + it.count;
    rowTotals[it.topic_label] = (rowTotals[it.topic_label] || 0) + it.count;
  });
  const orderedTopics = topicSet.sort((a, b) => (rowTotals[b] ?? 0) - (rowTotals[a] ?? 0));
  const preferred = ["NEGATIVE", "POSITIVE", "negative", "neutral", "positive"];
  const orderedSent = preferred.filter((s) => sentSet.includes(s));
  for (const s of sentSet) if (!orderedSent.includes(s)) orderedSent.push(s);

  function colorFor(share: number, sent: string) {
    const s = sent.toUpperCase();
    const a = Math.min(1, share * 1.1 + 0.05);
    if (s.includes("NEG")) return `rgba(217, 83, 79, ${a})`;
    if (s.includes("POS")) return `rgba(92, 184, 92, ${a})`;
    return `rgba(84, 119, 146, ${a})`;
  }

  return (
    <div className="mt-4 overflow-x-auto">
      <table className="min-w-full border-separate border-spacing-1 text-xs">
        <thead>
          <tr>
            <th className="text-left text-steel font-semibold px-2 py-1">Topic</th>
            {orderedSent.map((s) => (
              <th key={s} className="text-center text-steel font-semibold px-2 py-1">{s}</th>
            ))}
            <th className="text-right text-steel font-semibold px-2 py-1">Total</th>
          </tr>
        </thead>
        <tbody>
          {orderedTopics.map((t) => {
            const total = rowTotals[t] || 0;
            return (
              <tr key={t}>
                <td className="px-2 py-1 font-medium text-navy whitespace-nowrap">{t}</td>
                {orderedSent.map((s) => {
                  const c = matrix[t][s] || 0;
                  const share = total ? c / total : 0;
                  return (
                    <td key={s} className="text-center px-2 py-1 rounded"
                        style={{ background: c ? colorFor(share, s) : "#f5f5f5", minWidth: 80 }}>
                      <span className="font-semibold text-navy">{c.toLocaleString()}</span>
                      <span className="ml-1 text-[10px] text-steel">{(share * 100).toFixed(0)}%</span>
                    </td>
                  );
                })}
                <td className="text-right px-2 py-1 text-steel">{total.toLocaleString()}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function TopicTimeSeries({ items }: { items: { date: string; topic_label: string; count: number; neg: number; neg_share: number }[] }) {
  const topics = Array.from(new Set(items.map((i) => i.topic_label))).filter(Boolean).slice(0, 6);
  const dates  = Array.from(new Set(items.map((i) => i.date))).sort();
  const data = dates.map((d) => {
    const row: any = { date: d };
    for (const t of topics) {
      const m = items.find((i) => i.date === d && i.topic_label === t);
      row[t] = m ? Math.round(m.neg_share * 100) : null;
    }
    return row;
  });

  return (
    <div className="mt-4 h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: 8, right: 8, bottom: 40 }}>
          <CartesianGrid stroke="#EFD2B0" strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fill: "#547792", fontSize: 10 }} angle={-25} textAnchor="end" height={50} />
          <YAxis tick={{ fill: "#547792", fontSize: 11 }} label={{ value: "% negative", angle: -90, position: "insideLeft", fill: "#547792" }} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {topics.map((t, i) => (
            <Bar key={t} dataKey={t} stackId="a" fill={COLORS[i % COLORS.length]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Word cloud (dependency-free: scaled inline text) ─────────────────────────
function WordCloud({ items, tone = "mixed" }: { items: WordCloudItem[]; tone?: "positive" | "negative" | "neutral" | "mixed" }) {
  if (!items || items.length === 0) {
    return <p className="text-sm text-steel">No terms to display for the current filter.</p>;
  }
  const max = items[0]?.value ?? 1;
  const min = items[items.length - 1]?.value ?? 1;
  const minPx = 12;
  const maxPx = 44;
  // Sentiment-aware lexicons used to colour individual terms inside a mixed cloud.
  const NEG = new Set([
    "poor","bad","worst","terrible","awful","rude","delay","delayed","cancel","cancelled","cancellation",
    "lost","missed","late","horrible","disappointing","disappointed","unhelpful","refund","complaint","broken",
    "dirty","uncomfortable","slow","problem","issue","wait","waiting","stuck","never","worse","unprofessional",
  ]);
  const POS = new Set([
    "good","great","excellent","amazing","wonderful","best","love","loved","comfortable","clean","friendly",
    "helpful","smooth","easy","perfect","awesome","fantastic","enjoy","enjoyed","pleasant","polite","quick",
    "professional","outstanding","kind","nice","recommend",
  ]);

  function colorFor(w: string): string {
    if (tone === "positive") return "#1f7a5a"; // emerald-700
    if (tone === "negative") return "#b91c1c"; // red-700
    if (tone === "neutral") return "#547792";
    if (NEG.has(w)) return "#b91c1c";
    if (POS.has(w)) return "#1f7a5a";
    return "#1A3263";
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-xl bg-brand-50 p-5 leading-tight">
      {items.map((w) => {
        const ratio = max === min ? 1 : (w.value - min) / (max - min);
        const size = Math.round(minPx + ratio * (maxPx - minPx));
        const weight = 400 + Math.round(ratio * 500);
        return (
          <span
            key={w.text}
            title={`${w.text}: ${w.value.toLocaleString()} occurrences`}
            style={{ fontSize: `${size}px`, fontWeight: weight, color: colorFor(w.text), lineHeight: 1.1 }}
            className="inline-block transition-transform hover:scale-110"
          >
            {w.text}
          </span>
        );
      })}
    </div>
  );
}

// ── Per-airline sentiment stacked bar ────────────────────────────────────────
function AirlineSentimentChart({ items }: { items: AirlineStatRow[] }) {
  if (!items || items.length === 0) return null;
  const data = items.map((a) => ({
    airline: a.airline.length > 18 ? a.airline.slice(0, 17) + "…" : a.airline,
    positive: a.vader_positive,
    neutral: a.vader_neutral,
    negative: a.vader_negative,
    avg: a.avg_rating ?? 0,
  }));
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 0, right: 16, top: 4, bottom: 4 }}>
          <CartesianGrid stroke="#EFD2B0" strokeDasharray="3 3" />
          <XAxis type="number" tick={{ fill: "#547792", fontSize: 11 }} />
          <YAxis type="category" dataKey="airline" tick={{ fill: "#1A3263", fontSize: 11 }} width={130} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="positive" stackId="s" fill="#1f7a5a" />
          <Bar dataKey="neutral"  stackId="s" fill="#FFC570" />
          <Bar dataKey="negative" stackId="s" fill="#b91c1c" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Simple histogram (rating, length) ────────────────────────────────────────
function SimpleHistogram({ items, color = "#1A3263", yLabel }: { items: { label: string; count: number }[]; color?: string; yLabel?: string }) {
  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={items} margin={{ left: 0, right: 12, top: 4, bottom: 4 }}>
          <CartesianGrid stroke="#EFD2B0" strokeDasharray="3 3" />
          <XAxis dataKey="label" tick={{ fill: "#547792", fontSize: 11 }} />
          <YAxis tick={{ fill: "#547792", fontSize: 11 }} label={yLabel ? { value: yLabel, angle: -90, position: "insideLeft", fill: "#547792", fontSize: 11 } : undefined} />
          <Tooltip />
          <Bar dataKey="count" fill={color} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function NlpPage() {
  // ── data state ─────────────────────────────────────────────────────────────
  const [stats, setStats] = useState<Stats | null>(null);
  const [dist, setDist] = useState<Distributions | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [baseline, setBaseline] = useState<Baseline | null>(null);
  const [aspect, setAspect] = useState<AspectResponse | null>(null);
  const [timeseries, setTimeseries] = useState<TimeseriesResponse | null>(null);
  const [wordcloud, setWordcloud] = useState<WordCloudResponse | null>(null);
  const [wordcloudBusy, setWordcloudBusy] = useState(false);
  const [airlineStats, setAirlineStats] = useState<AirlineStatsResponse | null>(null);
  const [ratingDist, setRatingDist] = useState<RatingDistResponse | null>(null);
  const [lengthDist, setLengthDist] = useState<LengthDistResponse | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsTotal, setReviewsTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filterSentiment, setFilterSentiment] = useState<string>("");
  const [filterTopic, setFilterTopic] = useState<string>("");
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // ── live analyzer ──────────────────────────────────────────────────────────
  const [text, setText] = useState("");
  const [analyzeBusy, setAnalyzeBusy] = useState(false);
  const [analyzeOut, setAnalyzeOut] = useState<any | null>(null);
  const [analyzeErr, setAnalyzeErr] = useState<string | null>(null);

  // Initial loads
  useEffect(() => {
    setLoading(true);
    Promise.all([
      jget<Stats>("/stats"),
      jget<Distributions>("/distributions"),
      jget<Topic[]>("/topics"),
      jget<Entity[]>("/entities?limit=25"),
      jget<Baseline>("/baseline").catch(() => ({ available: false } as Baseline)),
      jget<AspectResponse>("/aspect-sentiment").catch(() => ({ available: false, items: [] } as AspectResponse)),
      jget<TimeseriesResponse>("/timeseries").catch(() => ({ available: false, items: [] } as TimeseriesResponse)),
    ])
      .then(([s, d, t, e, b, a, ts]) => {
        setStats(s);
        setDist(d);
        setTopics(t);
        setEntities(e);
        setBaseline(b);
        setAspect(a);
        setTimeseries(ts);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));

    // Independent fetches — failures don't block the main view
    jget<AirlineStatsResponse>("/airline-stats?top=10").then(setAirlineStats).catch(() => setAirlineStats({ available: false, items: [] }));
    jget<RatingDistResponse>("/rating-distribution").then(setRatingDist).catch(() => setRatingDist({ available: false, items: [] }));
    jget<LengthDistResponse>("/length-distribution").then(setLengthDist).catch(() => setLengthDist({ available: false, items: [] }));
  }, []);

  // Word cloud — reacts to the same filters as the review explorer
  useEffect(() => {
    const params = new URLSearchParams({ top: "70" });
    if (filterSentiment) params.set("sentiment", filterSentiment);
    if (filterTopic) params.set("topic", filterTopic);
    setWordcloudBusy(true);
    jget<WordCloudResponse>(`/wordcloud?${params}`)
      .then(setWordcloud)
      .catch(() => setWordcloud({ available: false, n_reviews: 0, source_column: "", items: [] }))
      .finally(() => setWordcloudBusy(false));
  }, [filterSentiment, filterTopic]);

  // Debounce search
  useEffect(() => {
    const id = setTimeout(() => setSearchDebounced(search), 350);
    return () => clearTimeout(id);
  }, [search]);

  // Reviews fetch
  useEffect(() => {
    const params = new URLSearchParams({ page: String(page), page_size: "12" });
    if (filterSentiment) params.set("sentiment", filterSentiment);
    if (filterTopic) params.set("topic", filterTopic);
    if (searchDebounced) params.set("q", searchDebounced);
    jget<{ total: number; items: Review[] }>(`/reviews?${params}`)
      .then((r) => {
        setReviews(r.items);
        setReviewsTotal(r.total);
      })
      .catch((err) => setError(err.message));
  }, [page, filterSentiment, filterTopic, searchDebounced]);

  async function analyze() {
    if (!text.trim()) return;
    setAnalyzeBusy(true);
    setAnalyzeErr(null);
    setAnalyzeOut(null);
    try {
      const r = await fetch(`${NLP}/sentiment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.detail || `Status ${r.status}`);
      setAnalyzeOut(data);
    } catch (e: any) {
      setAnalyzeErr(String(e.message || e));
    } finally {
      setAnalyzeBusy(false);
    }
  }

  const vaderPie = useMemo(
    () => (dist?.vader ?? []).map((d) => ({ name: d.label, value: d.count })),
    [dist]
  );

  // ── Business analysis (derived from topics + entities + sentiment) ─────────
  const analysis = useMemo(() => {
    const topicCount: Record<number, number> = {};
    (dist?.topics ?? []).forEach((t) => { topicCount[t.topic_id] = t.count; });

    const themeAgg: Record<string, { theme: Theme; volume: number; topicIds: number[] }> = {};
    topics.forEach((t) => {
      const words = t.top_words ?? t.top_terms ?? "";
      const th = classifyTopic(words) ?? (t.topic_label ? { key: t.topic_label, label: t.topic_label, tone: "neutral", keywords: [] } as Theme : null);
      if (!th) return;
      const vol = topicCount[t.topic_id] ?? 0;
      if (!themeAgg[th.key]) themeAgg[th.key] = { theme: th, volume: 0, topicIds: [] };
      themeAgg[th.key].volume += vol;
      themeAgg[th.key].topicIds.push(t.topic_id);
    });

    const themesRanked = Object.values(themeAgg).sort((a, b) => b.volume - a.volume);
    const painThemes   = themesRanked.filter((x) => x.theme.tone === "pain");
    const praiseThemes = themesRanked.filter((x) => x.theme.tone === "praise");

    const orgs = entities
      .filter((e) => (e.label || "").toUpperCase() === "ORG")
      .slice(0, 5)
      .map((e) => e.entity || e.text || "")
      .filter(Boolean);

    // Sentiment gap: BERT vs VADER (transformer is stricter on sarcasm/nuance)
    const vaderNeg = stats?.vader_counts?.negative ?? 0;
    const vaderPos = stats?.vader_counts?.positive ?? 0;
    const bertNeg  = stats?.bert_counts?.NEGATIVE ?? stats?.bert_counts?.negative ?? 0;
    const bertPos  = stats?.bert_counts?.POSITIVE ?? stats?.bert_counts?.positive ?? 0;
    const total    = stats?.total_reviews ?? 0;
    const vaderNegPct = total ? (vaderNeg / total) * 100 : 0;
    const bertNegPct  = total ? (bertNeg  / total) * 100 : 0;
    const sentimentGap = bertNegPct - vaderNegPct; // positive => BERT detects more negativity

    return {
      themesRanked, painThemes, praiseThemes,
      orgs, sentimentGap, vaderNegPct, bertNegPct, vaderPos, bertPos, total,
    };
  }, [topics, dist, entities, stats]);

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <SectionTitle
        eyebrow="Review Intelligence"
        title="Airline Reviews — NLP Workspace"
        subtitle="Scraped airline reviews enriched with VADER, DistilBERT sentiment, LDA topics and spaCy entities."
      />

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50/70">
          <p className="text-sm font-semibold text-red-700">NLP backend unreachable</p>
          <p className="mt-1 text-sm text-red-700/80">
            Start it with:&nbsp;
            <code className="rounded bg-white px-1.5 py-0.5">uvicorn 10_NLP.app.api:app --reload --port 8001 --reload-dir 10_NLP/app</code>
          </p>
          <p className="mt-2 text-xs text-red-700/70">Error: {error}</p>
        </Card>
      )}

      {loading && !error && (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-pulse">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-brand-50 ring-1 ring-brand-100" />
          ))}
        </div>
      )}

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Reviews analysed"
          value={stats ? stats.total_reviews.toLocaleString() : "—"}
          icon={<MessageSquare className="h-5 w-5" />}
        />
        <StatCard
          label="Positive share"
          value={stats ? `${stats.positive_pct.toFixed(1)}%` : "—"}
          icon={<Smile className="h-5 w-5" />}
        />
        <StatCard
          label="Negative share"
          value={stats ? `${stats.negative_pct.toFixed(1)}%` : "—"}
          icon={<Frown className="h-5 w-5" />}
        />
        <StatCard
          label="Topics discovered"
          value={stats ? String(stats.n_topics) : "—"}
          icon={<Hash className="h-5 w-5" />}
        />
      </div>

      {/* LIVE ANALYZER */}
      <div className="mt-10 grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-gold" />
            <h3 className="text-lg font-semibold text-navy">Live sentiment analyser</h3>
          </div>
          <p className="mt-1 text-sm text-steel">
            Run any review text through VADER (lexicon) and DistilBERT (transformer) in one click.
          </p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            placeholder="Paste a review… e.g. 'The crew was friendly but my baggage was delayed by 2 hours.'"
            className="mt-4 w-full rounded-xl border border-brand-100 bg-white p-3 text-sm text-navy outline-none focus:border-steel"
          />
          <div className="mt-3 flex items-center justify-between">
            <p className="text-xs text-steel">{text.length} chars</p>
            <button
              onClick={analyze}
              disabled={analyzeBusy || !text.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-navy px-4 py-2 text-sm font-semibold text-white shadow-soft hover:bg-brand-800 disabled:opacity-50"
            >
              {analyzeBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Analyse
            </button>
          </div>

          {analyzeErr && (
            <p className="mt-3 rounded-lg bg-red-50 p-3 text-xs text-red-700">{analyzeErr}</p>
          )}
          {analyzeOut && (
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-brand-100 bg-brand-50 p-4">
                <p className="text-xs uppercase tracking-widest text-steel">VADER</p>
                <p className="mt-1 text-2xl font-bold text-navy capitalize">{analyzeOut.vader.label}</p>
                <p className="mt-1 text-xs text-steel">
                  pos {analyzeOut.vader.pos.toFixed(2)} · neu {analyzeOut.vader.neu.toFixed(2)} · neg {analyzeOut.vader.neg.toFixed(2)}
                </p>
                <p className="text-xs text-steel">compound {analyzeOut.vader.compound.toFixed(3)}</p>
              </div>
              <div className="rounded-xl border border-brand-100 bg-gold-grad p-4 text-navy">
                <p className="text-xs uppercase tracking-widest opacity-80">DistilBERT</p>
                <p className="mt-1 text-2xl font-bold capitalize">{analyzeOut.distilbert.label.toLowerCase()}</p>
                <p className="mt-1 text-xs opacity-80">score {analyzeOut.distilbert.score.toFixed(3)}</p>
              </div>
              <div className="rounded-xl border border-brand-100 bg-white p-4">
                <p className="text-xs uppercase tracking-widest text-steel">Baseline (TF-IDF)</p>
                {analyzeOut.baseline ? (
                  <>
                    <p className="mt-1 text-2xl font-bold text-navy capitalize">{analyzeOut.baseline.label}</p>
                    <p className="mt-1 text-xs text-steel">{analyzeOut.baseline.model}</p>
                    {analyzeOut.baseline.proba && (
                      <p className="mt-1 text-[11px] text-steel">
                        {Object.entries(analyzeOut.baseline.proba as Record<string, number>)
                          .map(([k, v]) => `${k} ${(v * 100).toFixed(0)}%`).join(" · ")}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="mt-2 text-xs text-steel">Run notebook cell 4c to enable.</p>
                )}
              </div>
            </div>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <h3 className="text-lg font-semibold text-navy">Sentiment mix (VADER)</h3>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={vaderPie} dataKey="value" nameKey="name" innerRadius={45} outerRadius={85} paddingAngle={2}>
                  {vaderPie.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* DISTRIBUTIONS */}
      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="text-lg font-semibold text-navy">VADER compound histogram</h3>
          <div className="mt-3 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dist?.vader_histogram ?? []}>
                <CartesianGrid stroke="#EFD2B0" strokeDasharray="3 3" />
                <XAxis dataKey="bin" tick={{ fill: "#547792", fontSize: 10 }} />
                <YAxis tick={{ fill: "#547792", fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#547792" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-navy">Topic volume</h3>
          <div className="mt-3 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dist?.topics ?? []} margin={{ left: 8, right: 8, bottom: 60 }}>
                <CartesianGrid stroke="#EFD2B0" strokeDasharray="3 3" />
                <XAxis
                  dataKey={(d: any) => d.topic_label || `#${d.topic_id}`}
                  tick={{ fill: "#547792", fontSize: 10 }}
                  angle={-20}
                  textAnchor="end"
                  interval={0}
                  height={70}
                />
                <YAxis tick={{ fill: "#547792", fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#FFC570" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* BASELINE ML BENCHMARK */}
      {baseline?.available && baseline.results && (
        <div className="mt-10">
          <Card>
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-steel" />
              <h3 className="text-lg font-semibold text-navy">Baseline ML benchmark</h3>
            </div>
            <p className="mt-1 text-sm text-steel">
              Transparent reference point before running heavy NLP models — Logistic Regression and Multinomial
              Naive Bayes on TF-IDF features, with <b>SMOTE</b> applied to balance classes in training.
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {Object.entries(baseline.results).map(([name, m]) => (
                <div key={name} className="rounded-xl bg-brand-50 p-4 ring-1 ring-brand-100">
                  <p className="text-xs uppercase tracking-widest text-steel">{name}</p>
                  <p className="mt-2 text-2xl font-bold text-navy">{(m.accuracy * 100).toFixed(1)}%</p>
                  <p className="mt-1 text-xs text-steel">accuracy · macro-F1 {m.macro_f1.toFixed(3)}</p>
                </div>
              ))}
              {baseline.smote && (
                <div className="rounded-xl bg-white p-4 ring-1 ring-brand-100 sm:col-span-2">
                  <p className="text-xs uppercase tracking-widest text-steel">SMOTE class balancing</p>
                  <p className="mt-2 text-xs text-steel">
                    k_neighbors = <b>{baseline.smote.k_neighbors}</b> ·{" "}
                    train rows {baseline.n_train?.toLocaleString()} · test rows {baseline.n_test?.toLocaleString()} ·{" "}
                    {baseline.n_features?.toLocaleString()} TF-IDF features
                  </p>
                  <div className="mt-2 grid gap-2 text-xs sm:grid-cols-2">
                    <div>
                      <p className="font-semibold text-navy">Before SMOTE (train)</p>
                      <p className="text-steel">
                        {Object.entries(baseline.smote.train_before).map(([k, v]) => `${k}: ${v}`).join(" · ")}
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-navy">After SMOTE (train)</p>
                      <p className="text-steel">
                        {Object.entries(baseline.smote.train_after).map(([k, v]) => `${k}: ${v}`).join(" · ")}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <p className="mt-3 text-xs text-steel">
              These baselines exist so the DistilBERT / LDA results below can be evaluated against a simple,
              fast, explainable reference — not as the final model.
            </p>
          </Card>
        </div>
      )}

      {/* ASPECT-BASED SENTIMENT HEATMAP */}
      {aspect?.available && aspect.items.length > 0 && (
        <div className="mt-10">
          <Card>
            <div className="flex items-center gap-2">
              <Hash className="h-5 w-5 text-steel" />
              <h3 className="text-lg font-semibold text-navy">Aspect-based sentiment — Topic × DistilBERT</h3>
            </div>
            <p className="mt-1 text-sm text-steel">
              Each row shows how the transformer judged reviews assigned to that LDA topic.
              Use to spot pain points (e.g. high <span className="text-rose-600 font-medium">NEGATIVE</span> share on Delays).
            </p>
            <AspectHeatmap items={aspect.items} />
          </Card>
        </div>
      )}

      {/* TOPIC TIME SERIES */}
      {timeseries?.available && timeseries.items.length > 0 && (
        <div className="mt-10">
          <Card>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-steel" />
              <h3 className="text-lg font-semibold text-navy">Negative-share trend by topic</h3>
            </div>
            <p className="mt-1 text-sm text-steel">
              Daily share of DistilBERT-NEGATIVE reviews per topic. Early-warning signal for theme escalation.
            </p>
            <TopicTimeSeries items={timeseries.items} />
          </Card>
        </div>
      )}

      {/* TOPICS + ENTITIES */}
      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="flex items-center gap-2">
            <Tags className="h-5 w-5 text-steel" />
            <h3 className="text-lg font-semibold text-navy">LDA Topics</h3>
          </div>
          <ul className="mt-4 space-y-2">
            {topics.map((t) => (
              <li key={t.topic_id} className="rounded-xl border border-brand-100 bg-white/70 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Pill tone="navy">#{t.topic_id}</Pill>
                  {t.topic_label && (
                    <span className="text-sm font-semibold text-navy">{t.topic_label}</span>
                  )}
                </div>
                <p className="mt-1.5 text-xs text-steel font-mono break-all">
                  {t.top_words ?? t.top_terms}
                </p>
              </li>
            ))}
            {topics.length === 0 && <li className="text-sm text-steel">No topics available.</li>}
          </ul>
        </Card>

        <Card>
          <div className="flex items-center gap-2">
            <Hash className="h-5 w-5 text-steel" />
            <h3 className="text-lg font-semibold text-navy">Top named entities</h3>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {entities.map((e, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-navy ring-1 ring-brand-100"
              >
                <span className="font-semibold">{e.entity || e.text}</span>
                <span className="text-steel/80">· {e.label}</span>
                <span className="text-steel">×{e.count}</span>
              </span>
            ))}
            {entities.length === 0 && <p className="text-sm text-steel">No entities exported.</p>}
          </div>
        </Card>
      </div>

      {/* RECOMMENDATIONS */}
      <div className="mt-10">
        <Card className="bg-gradient-to-br from-white via-brand-50/40 to-sand/30">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-gold" />
            <h3 className="text-lg font-semibold text-navy">Business analysis &amp; recommended actions</h3>
          </div>
          <p className="mt-1 text-sm text-steel">
            Automated synthesis of LDA topics, sentiment models and named entities into a prioritized action plan.
          </p>

          {/* Headline signals */}
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-white p-4 ring-1 ring-brand-100">
              <p className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-steel">
                <TrendingUp className="h-3.5 w-3.5" /> Voice-of-customer tilt
              </p>
              <p className="mt-2 text-2xl font-bold text-navy">
                {stats ? `${(stats.positive_pct - stats.negative_pct).toFixed(1)} pts` : "—"}
              </p>
              <p className="mt-1 text-xs text-steel">
                Net sentiment (positive − negative). Anything below +20 pts in airline reviews is a retention red flag.
              </p>
            </div>
            <div className="rounded-xl bg-white p-4 ring-1 ring-brand-100">
              <p className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-steel">
                <AlertTriangle className="h-3.5 w-3.5" /> Hidden negativity (BERT vs VADER)
              </p>
              <p className="mt-2 text-2xl font-bold text-navy">
                {analysis.sentimentGap >= 0 ? "+" : ""}{analysis.sentimentGap.toFixed(1)} pts
              </p>
              <p className="mt-1 text-xs text-steel">
                DistilBERT flags <b>{analysis.bertNegPct.toFixed(0)}%</b> negative vs VADER&apos;s <b>{analysis.vaderNegPct.toFixed(0)}%</b> —
                the gap is sarcasm &amp; nuanced complaints lexical models miss.
              </p>
            </div>
            <div className="rounded-xl bg-white p-4 ring-1 ring-brand-100">
              <p className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-steel">
                <Target className="h-3.5 w-3.5" /> Themes detected
              </p>
              <p className="mt-2 text-2xl font-bold text-navy">{analysis.themesRanked.length}</p>
              <p className="mt-1 text-xs text-steel">
                {analysis.painThemes.length} pain · {analysis.praiseThemes.length} praise.
                {analysis.orgs.length > 0 && <> Top brands mentioned: <b>{analysis.orgs.join(", ")}</b>.</>}
              </p>
            </div>
          </div>

          {/* Theme ranking */}
          {analysis.themesRanked.length > 0 && (
            <div className="mt-6">
              <p className="text-sm font-semibold text-navy">Themes ranked by review volume</p>
              <div className="mt-2 space-y-2">
                {analysis.themesRanked.map((t) => {
                  const max = analysis.themesRanked[0].volume || 1;
                  const pct = Math.max(8, (t.volume / max) * 100);
                  const barColor =
                    t.theme.tone === "pain"   ? "bg-rose-400" :
                    t.theme.tone === "praise" ? "bg-emerald-400" :
                                                "bg-steel";
                  const pillTone =
                    t.theme.tone === "pain"   ? "navy" :
                    t.theme.tone === "praise" ? "gold" : "steel";
                  return (
                    <div key={t.theme.key} className="rounded-lg bg-white p-3 ring-1 ring-brand-100">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <Pill tone={pillTone as any}>{t.theme.tone}</Pill>
                          <span className="text-sm font-medium text-navy">{t.theme.label}</span>
                        </div>
                        <span className="text-xs text-steel">
                          {t.volume.toLocaleString()} reviews · topics {t.topicIds.join(", ")}
                        </span>
                      </div>
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-brand-50">
                        <div className={`h-full ${barColor}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Short-term + Long-term actions */}
          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl bg-navy p-5 text-white">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-gold" />
                <h4 className="font-semibold">Short-term (0–90 days)</h4>
              </div>
              <ul className="mt-3 space-y-2 text-sm">
                {buildShortTerm(analysis).map((a, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                    <span className="text-white/90">{a}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-gold to-sand p-5 text-navy">
              <div className="flex items-center gap-2">
                <Rocket className="h-5 w-5" />
                <h4 className="font-semibold">Long-term (6–18 months)</h4>
              </div>
              <ul className="mt-3 space-y-2 text-sm">
                {buildLongTerm(analysis).map((a, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-navy" />
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* KPI targets */}
          <div className="mt-6 rounded-xl bg-white p-4 ring-1 ring-brand-100">
            <p className="text-sm font-semibold text-navy">Suggested KPIs to track in the next dashboard refresh</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4 text-xs">
              <div className="rounded-lg bg-brand-50 p-3">
                <p className="font-semibold text-navy">Negative-review rate</p>
                <p className="text-steel">Target ↓ to &lt;20% (currently {analysis.bertNegPct.toFixed(0)}% via BERT)</p>
              </div>
              <div className="rounded-lg bg-brand-50 p-3">
                <p className="font-semibold text-navy">Delay-related mentions</p>
                <p className="text-steel">Target ↓ 30% QoQ in topic-volume chart</p>
              </div>
              <div className="rounded-lg bg-brand-50 p-3">
                <p className="font-semibold text-navy">Crew/service praise share</p>
                <p className="text-steel">Target ↑ to ≥35% of positive reviews</p>
              </div>
              <div className="rounded-lg bg-brand-50 p-3">
                <p className="font-semibold text-navy">BERT–VADER gap</p>
                <p className="text-steel">Target ↓ &lt;5 pts (better sarcasm catch = better resolution)</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* REVIEWS */}
      <div className="mt-10">
        <Card>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-navy">Review explorer</h3>
              <p className="text-sm text-steel">
                {reviewsTotal.toLocaleString()} match{reviewsTotal === 1 ? "" : "es"} · page {page}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-steel" />
                <input
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Search…"
                  className="rounded-lg border border-brand-100 bg-white py-1.5 pl-8 pr-3 text-sm outline-none focus:border-steel"
                />
              </div>
              <select
                value={filterSentiment}
                onChange={(e) => { setFilterSentiment(e.target.value); setPage(1); }}
                className="rounded-lg border border-brand-100 bg-white px-2 py-1.5 text-sm"
              >
                <option value="">All sentiments</option>
                <option value="positive">Positive</option>
                <option value="neutral">Neutral</option>
                <option value="negative">Negative</option>
              </select>
              <select
                value={filterTopic}
                onChange={(e) => { setFilterTopic(e.target.value); setPage(1); }}
                className="rounded-lg border border-brand-100 bg-white px-2 py-1.5 text-sm"
              >
                <option value="">All topics</option>
                {topics.map((t) => (
                  <option key={t.topic_id} value={t.topic_id}>
                    {t.topic_label ? t.topic_label : `Topic #${t.topic_id}`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ── Review insights ─────────────────────────────────────────── */}
          <div className="mt-6 space-y-6">
            {/* Word cloud — reacts to the same filters */}
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-navy">
                  <Cloud className="h-4 w-4 text-steel" />
                  Word cloud — most frequent terms
                  {wordcloudBusy && <Loader2 className="h-3 w-3 animate-spin text-steel" />}
                </div>
                <span className="text-xs text-steel">
                  {wordcloud?.n_reviews?.toLocaleString() ?? "—"} reviews
                  {filterSentiment && ` · ${filterSentiment}`}
                  {filterTopic && ` · topic #${filterTopic}`}
                </span>
              </div>
              <p className="mt-1 text-xs text-steel">
                Built from the lemmatised, stop-word-filtered review text.
                Red = negative sentiment terms, green = positive, navy = neutral / domain-specific.
              </p>
              <div className="mt-3">
                {wordcloud && wordcloud.items.length > 0 ? (
                  <WordCloud
                    items={wordcloud.items}
                    tone={
                      filterSentiment === "positive" ? "positive" :
                      filterSentiment === "negative" ? "negative" :
                      filterSentiment === "neutral"  ? "neutral"  : "mixed"
                    }
                  />
                ) : (
                  <p className="text-sm text-steel">No terms to display for the current filter.</p>
                )}
              </div>
            </div>

            {/* 3-column insight grid */}
            <div className="grid gap-4 lg:grid-cols-3">
              {/* Rating distribution */}
              <div className="rounded-xl bg-white p-4 ring-1 ring-brand-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-semibold text-navy">
                    <Star className="h-4 w-4 text-gold" /> Rating distribution
                  </div>
                  {ratingDist?.available && (
                    <span className="text-xs text-steel">
                      μ {ratingDist.mean} · med {ratingDist.median}
                    </span>
                  )}
                </div>
                {ratingDist?.available
                  ? <div className="mt-2"><SimpleHistogram items={ratingDist.items} color="#FFC570" yLabel="reviews" /></div>
                  : <p className="mt-3 text-sm text-steel">No rating data.</p>}
              </div>

              {/* Length distribution */}
              <div className="rounded-xl bg-white p-4 ring-1 ring-brand-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-semibold text-navy">
                    <AlignLeft className="h-4 w-4 text-steel" /> Review length (words)
                  </div>
                  {lengthDist?.available && (
                    <span className="text-xs text-steel">
                      μ {lengthDist.mean} · med {lengthDist.median}
                    </span>
                  )}
                </div>
                {lengthDist?.available
                  ? <div className="mt-2"><SimpleHistogram items={lengthDist.items} color="#547792" yLabel="reviews" /></div>
                  : <p className="mt-3 text-sm text-steel">No length data.</p>}
              </div>

              {/* Top entities mini-bar */}
              <div className="rounded-xl bg-white p-4 ring-1 ring-brand-100">
                <div className="flex items-center gap-2 text-sm font-semibold text-navy">
                  <Tags className="h-4 w-4 text-steel" /> Top named entities
                </div>
                <p className="mt-1 text-[11px] text-steel">spaCy NER — most-mentioned places, brands and dates.</p>
                {entities.length > 0 ? (
                  <div className="mt-2 h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={entities.slice(0, 10).map(e => ({ name: (e.entity || e.text || "").split(":")[0], count: e.count }))} layout="vertical" margin={{ left: 0, right: 12 }}>
                        <CartesianGrid stroke="#EFD2B0" strokeDasharray="3 3" />
                        <XAxis type="number" tick={{ fill: "#547792", fontSize: 10 }} />
                        <YAxis type="category" dataKey="name" tick={{ fill: "#1A3263", fontSize: 10 }} width={90} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#1A3263" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : <p className="mt-3 text-sm text-steel">No entities.</p>}
              </div>
            </div>

            {/* Per-airline sentiment breakdown */}
            {airlineStats?.available && airlineStats.items.length > 0 && (
              <div className="rounded-xl bg-white p-4 ring-1 ring-brand-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-semibold text-navy">
                    <Plane className="h-4 w-4 text-steel" /> Sentiment by airline (top {airlineStats.items.length})
                  </div>
                  <span className="text-xs text-steel">VADER positive · neutral · negative</span>
                </div>
                <p className="mt-1 text-xs text-steel">
                  Stacked counts highlight which carriers dominate the negative-review pool.
                </p>
                <div className="mt-3">
                  <AirlineSentimentChart items={airlineStats.items} />
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {loading && <p className="text-sm text-steel">Loading…</p>}
            {!loading && reviews.length === 0 && <p className="text-sm text-steel">No reviews match.</p>}
            {reviews.map((r, i) => {
              const tone =
                r.sent_vader_label === "positive" ? "bg-emerald-50 ring-emerald-200" :
                r.sent_vader_label === "negative" ? "bg-rose-50 ring-rose-200" :
                "bg-brand-50 ring-brand-100";
              return (
                <div key={i} className={`rounded-xl ring-1 p-4 text-sm text-navy ${tone}`}>
                  <p className="line-clamp-5">{r.text_clean}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
                    {r.sent_vader_label && <Pill tone="navy">VADER: {r.sent_vader_label}</Pill>}
                    {r.sent_bert_label && <Pill tone="steel">BERT: {r.sent_bert_label.toLowerCase()}</Pill>}
                    {r.topic_label
                      ? <Pill tone="gold">{r.topic_label}</Pill>
                      : (r.topic_id !== undefined && r.topic_id !== null && <Pill tone="gold">Topic #{r.topic_id}</Pill>)
                    }
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 flex items-center justify-between">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-navy ring-1 ring-brand-100 disabled:opacity-40"
            >
              ← Previous
            </button>
            <span className="text-xs text-steel">
              {Math.min((page - 1) * 12 + 1, reviewsTotal)}–{Math.min(page * 12, reviewsTotal)} of {reviewsTotal}
            </span>
            <button
              disabled={page * 12 >= reviewsTotal}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg bg-navy px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-800 disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        </Card>
      </div>
    </>
  );
}
