"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";

const STAGES = [
  { value: 100000, label: "Candidate pool", detail: "Every candidate available to this job." },
  { value: 5000, label: "Dense retrieval", detail: "FAISS semantic search narrows the pool to its closest matches." },
  { value: 1000, label: "Pre-rank", detail: "Metadata filtering (skills, experience, industry) narrows further." },
  { value: 100, label: "Ranked + explained", detail: "The final hybrid-ranked, explained shortlist." },
];

/**
 * A thin full-width band showing the retrieval funnel — replaces the old KPI
 * card row. Numeral widths are proportional (sqrt-scaled so the narrow end
 * stays legible), connected by a single rule. Clicking a stage expands its
 * explanation beneath the rail.
 */
export function FunnelRail({ className }: { className?: string }) {
  const [active, setActive] = useState<number | null>(null);
  const maxValue = STAGES[0].value;

  return (
    <div className={cn("border-b border-border", className)}>
      <div className="flex items-end">
        {STAGES.map((stage, i) => {
          const widthPct = Math.max(12, Math.sqrt(stage.value / maxValue) * 100);
          return (
            <button
              key={stage.label}
              onClick={() => setActive(active === i ? null : i)}
              className={cn(
                "group flex-1 border-r border-border px-4 py-3 text-left transition last:border-r-0",
                active === i ? "bg-surface-hover" : "hover:bg-surface-hover"
              )}
              aria-expanded={active === i}
            >
              <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-muted-foreground">
                {stage.label}
              </p>
              <p className="mt-1 font-serif text-2xl font-semibold tabular-nums text-foreground">
                {stage.value.toLocaleString("en-US")}
              </p>
              <div className="mt-2 h-[3px] rounded-full bg-border">
                <div
                  className="h-full rounded-full bg-accent-fg transition-all"
                  style={{ width: `${widthPct}%` }}
                />
              </div>
            </button>
          );
        })}
      </div>
      {active !== null && (
        <div className="border-t border-border bg-surface-hover px-4 py-3">
          <p className="text-sm text-muted-foreground">{STAGES[active].detail}</p>
        </div>
      )}
    </div>
  );
}
