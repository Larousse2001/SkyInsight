"use client";

import { Card, Pill, SectionTitle } from "@/components/ui";
import { BarChart3, ExternalLink, Maximize2, RefreshCcw } from "lucide-react";
import { useRef, useState } from "react";

const PBI_SRC =
  "https://app.powerbi.com/reportEmbed?reportId=766574a9-5bf8-4631-8afe-605e8a71e6e6&autoAuth=true&ctid=604f1a96-cbe8-43f8-abbf-f8eaf5d85730";

export default function PowerBIPage() {
  const ref = useRef<HTMLIFrameElement>(null);
  const [key, setKey] = useState(0);

  function refresh() {
    setKey((k) => k + 1);
  }

  function fullscreen() {
    const el = ref.current as unknown as HTMLElement | null;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen?.();
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionTitle
          eyebrow="Embedded BI"
          title="AirlineDW — Live Power BI Workspace"
          subtitle="Executive view sourced directly from the AirlineDW data warehouse. Slicers, drill-throughs and bookmarks all work."
        />
        <div className="flex items-center gap-2">
          <Pill tone="gold">
            <BarChart3 className="mr-1.5 inline h-3 w-3" /> Live report
          </Pill>
          <button
            onClick={refresh}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-navy ring-1 ring-brand-100 hover:bg-brand-50"
          >
            <RefreshCcw className="h-4 w-4" /> Refresh
          </button>
          <button
            onClick={fullscreen}
            className="inline-flex items-center gap-1.5 rounded-lg bg-navy px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-800"
          >
            <Maximize2 className="h-4 w-4" /> Fullscreen
          </button>
          <a
            href={PBI_SRC}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-gold px-3 py-1.5 text-sm font-semibold text-navy hover:brightness-95"
          >
            <ExternalLink className="h-4 w-4" /> Open in Power BI
          </a>
        </div>
      </div>

      <Card className="!p-2 overflow-hidden">
        <div className="relative w-full overflow-hidden rounded-xl bg-navy/5" style={{ aspectRatio: "1140 / 541.25" }}>
          <iframe
            key={key}
            ref={ref}
            title="AirlineDWPBI22v2"
            src={PBI_SRC}
            className="absolute inset-0 h-full w-full"
            frameBorder={0}
            allowFullScreen
          />
        </div>
      </Card>

      <div className="mt-8 grid gap-5 sm:grid-cols-3">
        <Card>
          <h3 className="text-sm font-semibold uppercase tracking-widest text-steel">Data source</h3>
          <p className="mt-2 text-navy font-medium">AirlineDW (SSIS-loaded star schema)</p>
          <p className="mt-1 text-sm text-steel">Dim_Customer · Dim_Date · Fact_FlightActivity · Fact_Satisfaction</p>
        </Card>
        <Card>
          <h3 className="text-sm font-semibold uppercase tracking-widest text-steel">Refresh cadence</h3>
          <p className="mt-2 text-navy font-medium">Daily incremental</p>
          <p className="mt-1 text-sm text-steel">Tuesday–Sunday 04:00 UTC, full reload on Mondays.</p>
        </Card>
        <Card>
          <h3 className="text-sm font-semibold uppercase tracking-widest text-steel">Security</h3>
          <p className="mt-2 text-navy font-medium">Azure AD + Row-Level Security</p>
          <p className="mt-1 text-sm text-steel">Scoped by tenant; embedded via AAD auto-auth token.</p>
        </Card>
      </div>
    </>
  );
}
