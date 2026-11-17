"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { CandidateResult } from "@/types/candidate";
import { formatScore, scoreColorClass } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

interface TopCandidatesTableProps {
  candidates: CandidateResult[];
}

export function TopCandidatesTable({ candidates }: TopCandidatesTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[700px] text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="pb-3 pl-4 pr-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Rank
            </th>
            <th className="px-3 pb-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Candidate ID
            </th>
            <th className="px-3 pb-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Final Score
            </th>
            <th className="px-3 pb-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Semantic
            </th>
            <th className="px-3 pb-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Skill
            </th>
            <th className="px-3 pb-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Experience
            </th>
            <th className="pb-3 pl-3 pr-4 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Top Skills
            </th>
          </tr>
        </thead>
        <tbody>
          {candidates.map((c, idx) => (
            <tr
              key={c.candidate_id}
              className="group border-b border-border transition-colors hover:bg-surface-hover"
            >
              {/* Rank */}
              <td className="py-3 pl-4 pr-3">
                <span
                  className={cn(
                    "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                    idx === 0
                      ? "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                      : idx === 1
                      ? "bg-muted-foreground/20 text-foreground"
                      : idx === 2
                      ? "bg-orange-600/20 text-orange-400"
                      : "bg-border text-muted-foreground"
                  )}
                >
                  {idx + 1}
                </span>
              </td>

              {/* ID */}
              <td className="px-3 py-3">
                <Link
                  href={`/candidates/${c.candidate_id}`}
                  className="font-mono text-sm font-medium text-muted-foreground hover:text-accent-fg transition-colors"
                >
                  {c.candidate_id}
                </Link>
              </td>

              {/* Final Score */}
              <td className="px-3 py-3 text-right">
                <span className={cn("font-bold", scoreColorClass(c.final_score))}>
                  {formatScore(c.final_score)}
                </span>
              </td>

              {/* Sub-scores */}
              <td className="px-3 py-3 text-right text-xs text-muted-foreground">
                {formatScore(c.sub_scores.semantic)}
              </td>
              <td className="px-3 py-3 text-right text-xs text-muted-foreground">
                {formatScore(c.sub_scores.skill)}
              </td>
              <td className="px-3 py-3 text-right text-xs text-muted-foreground">
                {c.reasons.matched_experience.toFixed(1)}y
              </td>

              {/* Top skills */}
              <td className="py-3 pl-3 pr-4">
                <div className="flex flex-wrap justify-end gap-1">
                  {(c.reasons.top_matching_skills ?? []).slice(0, 3).map((skill) => (
                    <span
                      key={skill}
                      className="rounded bg-violet-600/15 px-1.5 py-0.5 text-[10px] font-medium text-accent-fg"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 border-t border-border pt-3">
        <Link
          href="/candidates"
          className="inline-flex items-center gap-1 text-sm text-accent-fg hover:text-accent-fg transition-colors"
        >
          View all candidates
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
