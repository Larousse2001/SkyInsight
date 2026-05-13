import { api, Topic } from "@/lib/api";
import { Card } from "@/components/card";
import { Badge } from "@/components/badge";

export const dynamic = "force-dynamic";

export default async function TopicsPage() {
  const topics = await api<Topic[]>("/topics");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Topics</h1>
        <p className="mt-1 text-sm text-muted">
          Themes discovered by LDA across all reviews.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {topics.map((t) => (
          <Card key={t.topic_id}>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-muted">
                Topic
              </span>
              <Badge>#{t.topic_id}</Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              {t.top_terms.split(",").map((term, i) => (
                <span
                  key={i}
                  className="rounded-full border border-border bg-white/5 px-3 py-1 text-xs text-white"
                >
                  {term.trim()}
                </span>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
