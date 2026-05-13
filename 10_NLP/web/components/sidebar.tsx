"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Sparkles, Layers, Tags, MessageSquare, Plane } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "Overview", icon: BarChart3 },
  { href: "/analyze", label: "Analyze", icon: Sparkles },
  { href: "/topics", label: "Topics", icon: Layers },
  { href: "/entities", label: "Entities", icon: Tags },
  { href: "/reviews", label: "Reviews", icon: MessageSquare },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="sticky top-0 h-screen w-64 shrink-0 border-r border-border bg-surface/60 backdrop-blur">
      <div className="flex items-center gap-2 px-6 py-6">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-accent/20 text-accent">
          <Plane className="h-5 w-5" />
        </div>
        <div>
          <div className="text-sm font-semibold tracking-tight">SkyInsight</div>
          <div className="text-xs text-muted">NLP Dashboard</div>
        </div>
      </div>
      <nav className="px-3">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "mb-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition",
                active
                  ? "bg-accent/15 text-white shadow-glow"
                  : "text-muted hover:bg-white/5 hover:text-white",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="absolute bottom-0 w-full border-t border-border px-6 py-4 text-xs text-muted">
        v2.0 · Next.js + FastAPI
      </div>
    </aside>
  );
}
