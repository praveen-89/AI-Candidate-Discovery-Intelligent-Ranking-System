"use client";

import { cn } from "@/lib/utils/cn";

interface MatrixCandidate {
  id: string;
  matchedSkills: string[];
}

interface SkillCoverageMatrixProps {
  requiredSkills: string[];
  candidates: MatrixCandidate[];
  className?: string;
}

/**
 * Rows = the job's required skills, columns = shortlisted candidates. Filled
 * squares = matched, hollow = missing. Instantly surfaces which required
 * skills nobody in the shortlist actually has.
 */
export function SkillCoverageMatrix({ requiredSkills, candidates, className }: SkillCoverageMatrixProps) {
  if (requiredSkills.length === 0) {
    return <p className="text-sm text-muted-foreground">This job has no required skills extracted.</p>;
  }

  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full border-collapse text-left">
        <thead>
          <tr>
            <th className="pb-2 pr-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
              Skill
            </th>
            {candidates.map((c) => (
              <th
                key={c.id}
                className="w-7 pb-2 text-center font-mono text-[10px] font-normal text-tertiary-foreground"
                title={c.id}
              >
                {c.id.replace("CAND_", "").slice(-4)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {requiredSkills.map((skill) => {
            const matchedCount = candidates.filter((c) =>
              c.matchedSkills.some((s) => s.toLowerCase() === skill.toLowerCase())
            ).length;
            return (
              <tr key={skill} className="border-t border-border">
                <td className="py-1.5 pr-3 text-sm text-foreground">
                  {skill}
                  {matchedCount === 0 && (
                    <span className="ml-1.5 text-[10px] font-medium uppercase tracking-wide text-negative">
                      none
                    </span>
                  )}
                </td>
                {candidates.map((c) => {
                  const matched = c.matchedSkills.some((s) => s.toLowerCase() === skill.toLowerCase());
                  return (
                    <td key={c.id} className="py-1.5 text-center">
                      <span
                        className={cn(
                          "inline-block h-2.5 w-2.5",
                          matched ? "bg-accent-fg" : "border border-border"
                        )}
                        aria-label={matched ? `${skill}: matched` : `${skill}: missing`}
                      />
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
