import clsx from "clsx";

export function cn(...args: Parameters<typeof clsx>) {
  return clsx(...args);
}

export function sentimentColor(label: string) {
  const l = (label || "").toLowerCase();
  if (l.includes("pos")) return "text-success";
  if (l.includes("neg")) return "text-danger";
  return "text-warning";
}

export function sentimentBg(label: string) {
  const l = (label || "").toLowerCase();
  if (l.includes("pos")) return "bg-success/15 text-success border-success/30";
  if (l.includes("neg")) return "bg-danger/15 text-danger border-danger/30";
  return "bg-warning/15 text-warning border-warning/30";
}
