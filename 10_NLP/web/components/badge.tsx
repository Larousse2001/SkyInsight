import { cn, sentimentBg } from "@/lib/utils";

export function Badge({
  children,
  variant = "default",
  className,
}: {
  children: React.ReactNode;
  variant?: "default" | "sentiment";
  className?: string;
}) {
  if (variant === "sentiment") {
    const label = String(children);
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
          sentimentBg(label),
          className,
        )}
      >
        {label}
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-border bg-white/5 px-2 py-0.5 text-[11px] text-muted",
        className,
      )}
    >
      {children}
    </span>
  );
}
