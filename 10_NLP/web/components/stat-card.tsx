import { Card } from "./card";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  hint,
  accent = "accent",
}: {
  label: string;
  value: string | number;
  hint?: string;
  accent?: "accent" | "success" | "danger" | "warning";
}) {
  const bar = {
    accent: "bg-accent",
    success: "bg-success",
    danger: "bg-danger",
    warning: "bg-warning",
  }[accent];

  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted">{label}</div>
          <div className="mt-2 text-3xl font-semibold tracking-tight text-white">
            {value}
          </div>
          {hint && <div className="mt-1 text-xs text-muted">{hint}</div>}
        </div>
        <div className={cn("h-10 w-1 rounded-full", bar)} />
      </div>
    </Card>
  );
}
