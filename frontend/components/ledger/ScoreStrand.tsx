"use client";

import { useId, useState } from "react";
import { LEDGER_FACTORS } from "@/lib/ledger/factors";
import type { CandidateResult } from "@/types/candidate";
import { cn } from "@/lib/utils/cn";

interface ScoreStrandProps {
  candidate: Pick<CandidateResult, "final_score" | "sub_scores" | "reasons">;
  /** Track height. "sm" for dense table rows, "md" for the dossier. */
  size?: "sm" | "md";
  className?: string;
}

const HEIGHTS = { sm: "h-2", md: "h-3.5" };

/**
 * The product's signature visual: one horizontal stacked bar per candidate.
 * Total length = final score; segments are sized by each factor's
 * contribution_pct and colored by factor — it replaces every sub-score
 * column and the radar chart. Hovering a segment shows its sub-score and %
 * of total (as a native tooltip — keyboard/screen-reader accessible by
 * default, no custom tooltip JS needed for this).
 */
export function ScoreStrand({ candidate, size = "sm", className }: ScoreStrandProps) {
  const [hovered, setHovered] = useState<string | null>(null);
  const labelId = useId();
  const breakdown = candidate.reasons.ranking_score_breakdown;
  const widthPct = Math.max(0, Math.min(1, candidate.final_score)) * 100;

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn("relative w-full overflow-hidden rounded-[2px] bg-border", HEIGHTS[size])}
        role="img"
        aria-labelledby={labelId}
      >
        <span id={labelId} className="sr-only">
          Final score {candidate.final_score.toFixed(2)}, breakdown by factor:{" "}
          {LEDGER_FACTORS.map((f) => {
            const pct = breakdown[`${f.key}_contribution_pct` as keyof typeof breakdown];
            return `${f.label} ${pct.toFixed(1)}%`;
          }).join(", ")}
        </span>
        <div className="flex h-full" style={{ width: `${widthPct}%` }}>
          {LEDGER_FACTORS.map((f) => {
            const contributionPct = breakdown[`${f.key}_contribution_pct` as keyof typeof breakdown];
            const subScore = candidate.sub_scores[f.key];
            return (
              <div
                key={f.key}
                className="h-full transition-opacity"
                style={{
                  width: `${contributionPct}%`,
                  backgroundColor: f.color,
                  opacity: hovered && hovered !== f.key ? 0.35 : 1,
                }}
                title={`${f.label} · ${subScore.toFixed(2)} sub-score · ${contributionPct.toFixed(0)}% of total`}
                onMouseEnter={() => setHovered(f.key)}
                onMouseLeave={() => setHovered(null)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
