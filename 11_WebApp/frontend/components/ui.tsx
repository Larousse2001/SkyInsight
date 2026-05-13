import clsx from "clsx";
import type { HTMLAttributes, PropsWithChildren } from "react";

export function Card({ className, children, ...rest }: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) {
  return (
    <div
      className={clsx(
        "rounded-2xl border border-slate-200/70 bg-white/80 backdrop-blur shadow-sm shadow-slate-200/40 p-6",
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
    <div className="inline-flex flex-col rounded-xl bg-slate-50 px-3 py-2">
      <span className="text-[10px] uppercase tracking-wider text-slate-500">{label}</span>
      <span className="text-sm font-semibold text-slate-900">{value}</span>
    </div>
  );
}

export function SectionTitle({ eyebrow, title, subtitle }: { eyebrow?: string; title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      {eyebrow && (
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">{eyebrow}</p>
      )}
      <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{title}</h2>
      {subtitle && <p className="mt-2 max-w-2xl text-slate-600">{subtitle}</p>}
    </div>
  );
}
