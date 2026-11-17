"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { ScoreBreakdown } from "@/components/candidates/ScoreBreakdown";
import { formatScore, scoreColorClass } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { CandidateResult } from "@/types/candidate";

interface ExistingMatchCardProps {
  candidate: CandidateResult;
  rank: number;
}

export function ExistingMatchCard({ candidate: c, rank }: ExistingMatchCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-lg">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs text-muted-foreground">Rank #{rank} &middot; from existing pool</p>
          <p className="mt-0.5 font-mono text-sm font-semibold text-foreground">{c.candidate_id}</p>
        </div>
        <span className={cn("text-2xl font-bold", scoreColorClass(c.final_score))}>
          {formatScore(c.final_score)}
        </span>
      </div>

      {c.reasons.top_matching_skills.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {c.reasons.top_matching_skills.slice(0, 8).map((s) => (
            <span key={s} className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              {s}
            </span>
          ))}
        </div>
      )}

      {c.reasons.why_candidate_matches.length > 0 && (
        <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
          {c.reasons.why_candidate_matches.map((reason, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-accent-fg">•</span>
              {reason}
            </li>
          ))}
        </ul>
      )}

      <button
        onClick={() => setExpanded((v) => !v)}
        className="mt-3 flex items-center gap-1 text-xs font-medium text-accent-fg hover:text-accent-fg"
      >
        {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        {expanded ? "Hide score breakdown" : "Show full score breakdown"}
      </button>

      {expanded && (
        <div className="mt-4 border-t border-border pt-4">
          <ScoreBreakdown subScores={c.sub_scores} />
          {c.reasons.missing_requirements.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-medium text-muted-foreground">Missing requirements</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {c.reasons.missing_requirements.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[11px] text-red-300"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
