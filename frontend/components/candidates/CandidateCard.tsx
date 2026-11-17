"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { CandidateResult } from "@/types/candidate";
import { formatScore, scoreColorClass } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

interface CandidateCardProps {
  candidate: CandidateResult;
  rank: number;
}

export function CandidateCard({ candidate: c, rank }: CandidateCardProps) {
  return (
    <div className="group rounded-xl border border-border bg-surface p-5 transition-all hover:border-violet-500/30 hover:bg-surface-hover">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <p className="mb-0.5 text-xs text-muted-foreground">Rank #{rank}</p>
          <p className="font-mono text-sm font-semibold text-foreground">{c.candidate_id}</p>
        </div>
        <span className={cn("text-2xl font-bold", scoreColorClass(c.final_score))}>
          {formatScore(c.final_score)}
        </span>
      </div>

      {/* Mini score grid */}
      <div className="mb-3 grid grid-cols-4 gap-2 text-center text-xs">
        {[
          { label: "Sem", val: c.sub_scores.semantic },
          { label: "Skill", val: c.sub_scores.skill },
          { label: "Exp", val: c.sub_scores.experience },
          { label: "Edu", val: c.sub_scores.education },
        ].map(({ label, val }) => (
          <div key={label} className="rounded-lg bg-border py-1.5">
            <p className={cn("font-semibold", scoreColorClass(val))}>{formatScore(val)}</p>
            <p className="text-[10px] text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* Top skills */}
      {(c.reasons.top_matching_skills ?? []).length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1">
          {c.reasons.top_matching_skills.slice(0, 4).map((s) => (
            <span key={s} className="rounded bg-violet-600/15 px-1.5 py-0.5 text-[10px] text-accent-fg">
              {s}
            </span>
          ))}
        </div>
      )}

      <Link
        href={`/candidates/${c.candidate_id}`}
        className="inline-flex items-center gap-1 text-xs text-accent-fg opacity-0 transition group-hover:opacity-100"
      >
        View details <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}
