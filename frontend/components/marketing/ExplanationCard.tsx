"use client";

import { SCORE_FACTORS } from "@/lib/marketing/factors";
import { ScoreBar } from "./ScoreBar";
import { cn } from "@/lib/utils/cn";

export interface ExplanationCardData {
  candidateId: string;
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
  reasons: string[];
}

export const SAMPLE_EXPLANATIONS: ExplanationCardData[] = [
  {
    candidateId: "CAND_0046064",
    score: 0.87,
    matchedSkills: ["python", "pytorch", "rag", "faiss"],
    missingSkills: ["kubernetes"],
    reasons: [
      "Strong match for required skills: python, pytorch, rag, faiss.",
      "Exceeds experience requirement with 8.9 years.",
      "High semantic similarity to the core job description.",
    ],
  },
  {
    candidateId: "CAND_0071974",
    score: 0.72,
    matchedSkills: ["langchain", "elasticsearch", "python"],
    missingSkills: ["pytorch", "aws"],
    reasons: [
      "Close to experience requirement with 7.8 years.",
      "Located in a preferred Tier-1 city.",
    ],
  },
  {
    candidateId: "CAND_0088025",
    score: 0.64,
    matchedSkills: ["python", "llms"],
    missingSkills: ["faiss", "kubernetes", "aws"],
    reasons: ["Candidate is actively looking for new opportunities."],
  },
];

interface ExplanationCardProps {
  data: ExplanationCardData;
  className?: string;
  /** Tighter padding/spacing and a single reason line — for contexts like the
   * hero's stacked card preview, where several cards need to fit on screen. */
  compact?: boolean;
}

/**
 * A realistic candidate result card: score, factor breakdown, matched/missing
 * skills, and plain-language reasons — the "anatomy of an explanation" the
 * product is built around.
 */
export function ExplanationCard({ data, className, compact = false }: ExplanationCardProps) {
  const reasons = compact ? data.reasons.slice(0, 1) : data.reasons;

  return (
    <div className={cn("rounded-xl border border-mkt-border bg-mkt-surface", compact ? "p-4" : "p-5", className)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-mkt-text-secondary">Candidate</p>
          <p className="mt-0.5 font-mono text-sm font-medium text-mkt-text">{data.candidateId}</p>
        </div>
        <p className={cn("font-mono font-semibold tabular-nums text-mkt-text", compact ? "text-xl" : "text-2xl")}>
          {data.score.toFixed(2)}
        </p>
      </div>

      <ScoreBar className={compact ? "mt-3" : "mt-4"} height="sm" />

      {data.matchedSkills.length > 0 && (
        <div className={cn("flex flex-wrap gap-1.5", compact ? "mt-3" : "mt-4")}>
          {data.matchedSkills.map((skill) => (
            <span
              key={skill}
              className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-700 dark:text-emerald-400"
            >
              {skill}
            </span>
          ))}
          {!compact &&
            data.missingSkills.map((skill) => (
              <span
                key={skill}
                className="rounded-full border border-mkt-border px-2 py-0.5 text-[11px] text-mkt-text-secondary line-through"
              >
                {skill}
              </span>
            ))}
        </div>
      )}

      {reasons.length > 0 && (
        <ul className={cn("space-y-1.5 border-t border-mkt-border", compact ? "mt-3 pt-2.5" : "mt-4 pt-3")}>
          {reasons.map((reason, i) => (
            <li key={i} className="flex gap-2 text-xs leading-relaxed text-mkt-text-secondary">
              <span className="text-mkt-accent">·</span>
              {reason}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Exposed for other components that only need the factor list/colors. */
export { SCORE_FACTORS };
