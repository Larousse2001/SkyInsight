import clsx from "clsx";
import type { HTMLAttributes, PropsWithChildren, ReactNode } from "react";

export function Card({ className, children, ...rest }: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) {
  return (
    <div
      className={clsx(
        "rounded-2xl border border-brand-100/70 bg-white/85 backdrop-blur shadow-soft p-6 transition-shadow hover:shadow-glow",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function StatBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="inline-flex flex-col rounded-xl bg-brand-50 ring-1 ring-brand-100 px-3 py-2">
      <span className="text-[10px] uppercase tracking-wider text-steel">{label}</span>
      <span className="text-sm font-semibold text-navy">{value}</span>
    </div>
  );
}

export function StatCard({
  label,
  value,
  delta,
  icon,
}: {
  label: string;
  value: string;
  delta?: string;
  icon?: ReactNode;
}) {
  return (
    <Card className="!p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-steel">{label}</p>
          <p className="mt-1 text-2xl font-bold text-navy">{value}</p>
          {delta && <p className="mt-1 text-xs font-medium text-steel">{delta}</p>}
        </div>
        {icon && (
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gold-grad text-navy shadow-soft">
            {icon}
          </span>
        )}
      </div>
    </Card>
  );
}

export function SectionTitle({ eyebrow, title, subtitle }: { eyebrow?: string; title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      {eyebrow && (
        <p className="text-xs font-semibold uppercase tracking-widest text-steel">{eyebrow}</p>
      )}
      <h2 className="mt-1 text-2xl font-bold tracking-tight text-navy sm:text-3xl font-display">{title}</h2>
      {subtitle && <p className="mt-2 max-w-2xl text-steel">{subtitle}</p>}
    </div>
  );
}

export function Pill({ children, tone = "navy" }: { children: ReactNode; tone?: "navy" | "gold" | "steel" | "sand" }) {
  const tones: Record<string, string> = {
    navy:  "bg-navy text-white",
    gold:  "bg-gold text-navy",
    steel: "bg-steel text-white",
    sand:  "bg-sand text-navy",
  };
  return (
    <span className={clsx("inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold", tones[tone])}>
      {children}
    </span>
  );
}
