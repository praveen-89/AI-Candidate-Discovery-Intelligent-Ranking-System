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
          <tr className="border-b border-slate-700/50">
            <th className="pb-3 pl-4 pr-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
              Rank
            </th>
            <th className="px-3 pb-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
              Candidate ID
            </th>
            <th className="px-3 pb-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
              Final Score
            </th>
            <th className="px-3 pb-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
              Semantic
            </th>
            <th className="px-3 pb-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
              Skill
            </th>
            <th className="px-3 pb-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
              Experience
            </th>
            <th className="pb-3 pl-3 pr-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
              Top Skills
            </th>
          </tr>
        </thead>
        <tbody>
          {candidates.map((c, idx) => (
            <tr
              key={c.candidate_id}
              className="group border-b border-slate-700/30 transition-colors hover:bg-slate-700/20"
            >
              {/* Rank */}
              <td className="py-3 pl-4 pr-3">
                <span
                  className={cn(
                    "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                    idx === 0
                      ? "bg-amber-500/20 text-amber-400"
                      : idx === 1
                      ? "bg-slate-500/20 text-slate-300"
                      : idx === 2
                      ? "bg-orange-600/20 text-orange-400"
                      : "bg-slate-700/40 text-slate-500"
                  )}
                >
                  {idx + 1}
                </span>
              </td>

              {/* ID */}
              <td className="px-3 py-3">
                <Link
                  href={`/candidates/${c.candidate_id}`}
                  className="font-mono text-sm font-medium text-slate-200 hover:text-violet-400 transition-colors"
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
              <td className="px-3 py-3 text-right text-xs text-slate-400">
                {formatScore(c.sub_scores.semantic)}
              </td>
              <td className="px-3 py-3 text-right text-xs text-slate-400">
                {formatScore(c.sub_scores.skill)}
              </td>
              <td className="px-3 py-3 text-right text-xs text-slate-400">
                {c.reasons.matched_experience.toFixed(1)}y
              </td>

              {/* Top skills */}
              <td className="py-3 pl-3 pr-4">
                <div className="flex flex-wrap justify-end gap-1">
                  {(c.reasons.top_matching_skills ?? []).slice(0, 3).map((skill) => (
                    <span
                      key={skill}
                      className="rounded bg-violet-600/15 px-1.5 py-0.5 text-[10px] font-medium text-violet-400"
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

      <div className="mt-4 border-t border-slate-700/30 pt-3">
        <Link
          href="/candidates"
          className="inline-flex items-center gap-1 text-sm text-violet-400 hover:text-violet-300 transition-colors"
        >
          View all candidates
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
