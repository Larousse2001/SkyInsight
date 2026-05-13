import { api, Entity } from "@/lib/api";
import { Card, CardTitle } from "@/components/card";
import { Badge } from "@/components/badge";

export const dynamic = "force-dynamic";

const LABEL_COLORS: Record<string, string> = {
  ORG: "bg-accent/15 text-accent border-accent/30",
  GPE: "bg-accent2/15 text-accent2 border-accent2/30",
  PERSON: "bg-warning/15 text-warning border-warning/30",
  DATE: "bg-success/15 text-success border-success/30",
  MONEY: "bg-success/15 text-success border-success/30",
};

export default async function EntitiesPage() {
  const entities = await api<Entity[]>("/entities?limit=50");

  // Group by label
  const grouped: Record<string, Entity[]> = {};
  for (const e of entities) {
    const lbl = e.label || "OTHER";
    (grouped[lbl] ||= []).push(e);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Named Entities</h1>
        <p className="mt-1 text-sm text-muted">
          Real-world things (airlines, places, dates) mentioned across reviews.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {Object.entries(grouped).map(([label, items]) => (
          <Card key={label}>
            <CardTitle>
              <span
                className={`mr-2 inline-block rounded-md border px-2 py-0.5 text-[10px] font-medium uppercase ${
                  LABEL_COLORS[label] ?? "border-border bg-white/5 text-muted"
                }`}
              >
                {label}
              </span>
              <span className="text-muted">{items.length} entities</span>
            </CardTitle>
            <div className="space-y-2">
              {items.slice(0, 15).map((e) => (
                <div
                  key={e.entity}
                  className="flex items-center justify-between border-b border-border/50 py-1.5"
                >
                  <span className="text-sm text-white">{e.text}</span>
                  <Badge>{e.count}</Badge>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
