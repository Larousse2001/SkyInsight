"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plane, Menu, X } from "lucide-react";
import clsx from "clsx";
import { useState } from "react";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/bi", label: "Power BI" },
  { href: "/nlp", label: "Reviews NLP" },
  { href: "/predict/satisfaction", label: "Satisfaction" },
  { href: "/predict/delay", label: "Delay" },
  { href: "/predict/cnn", label: "Vision" },
  { href: "/forecast/co2", label: "CO₂" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-brand-100/70 bg-white/75 backdrop-blur-xl shadow-soft">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 py-3">
        <Link href="/" className="flex items-center gap-2.5 font-semibold text-navy">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-hero-grad text-white shadow-glow">
            <Plane className="h-5 w-5" />
          </span>
          <div className="leading-tight">
            <div className="text-lg font-bold tracking-tight">SkyInsight</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-steel">AI for Airlines</div>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-0.5">
          {NAV.map((item) => {
            const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "rounded-lg px-3 py-1.5 text-sm font-medium transition-all",
                  active
                    ? "bg-navy text-white shadow-soft"
                    : "text-navy/70 hover:bg-brand-100/60 hover:text-navy"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden lg:flex items-center gap-2">
          <Link
            href="/predict/satisfaction"
            className="rounded-xl bg-gold px-4 py-2 text-sm font-semibold text-navy shadow-soft transition hover:brightness-95"
          >
            Try a model
          </Link>
        </div>

        <button
          aria-label="Toggle menu"
          onClick={() => setOpen(!open)}
          className="lg:hidden rounded-lg p-2 text-navy hover:bg-brand-100/60"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <nav className="lg:hidden border-t border-brand-100/70 bg-white/90 px-4 py-3">
          <div className="grid gap-1">
            {NAV.map((item) => {
              const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={clsx(
                    "rounded-lg px-3 py-2 text-sm font-medium",
                    active ? "bg-navy text-white" : "text-navy/80 hover:bg-brand-100/60"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </header>
  );
}
