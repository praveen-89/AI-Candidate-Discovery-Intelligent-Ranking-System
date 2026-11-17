"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { ArrowLeft, UserSquare2, CheckCircle2, XCircle } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { ScoreBreakdown } from "@/components/candidates/ScoreBreakdown";
import { RadarChart } from "@/components/candidates/RadarChart";
import { SkeletonDetail } from "@/components/ui/SkeletonCard";
import { ErrorState } from "@/components/ui/ErrorState";
import { getCandidate } from "@/lib/api/candidates";
import { formatScore, scoreColorClass } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { CandidateResult } from "@/types/candidate";

export default function CandidateDetailPage({
  params,
}: {
  params: Promise<{ candidateId: string }>;
}) {
  const { candidateId } = use(params);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [candidate, setCandidate] = useState<CandidateResult | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      // API expects the URL-decoded candidate ID
      const decodedId = decodeURIComponent(candidateId);
      const resData = await getCandidate(decodedId);
      setCandidate(resData);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [candidateId]);

  if (error) {
    return (
      <AppShell pageTitle="Candidate Details">
        <ErrorState error={error} onRetry={loadData} />
      </AppShell>
    );
  }

  if (loading || !candidate) {
    return (
      <AppShell pageTitle="Candidate Details">
        <SkeletonDetail />
      </AppShell>
    );
  }

  const { reasons } = candidate;

  return (
    <AppShell pageTitle="Candidate Details">
      <div className="mb-6">
        <Link
          href="/candidates"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-accent-fg transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Candidates
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Header & Radar */}
        <div className="space-y-6 lg:col-span-1">
          {/* Header Card */}
          <div className="rounded-xl border border-border bg-surface p-6 shadow-lg">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-violet-500/10 border border-violet-500/20">
              <UserSquare2 className="h-7 w-7 text-accent-fg" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Candidate Profile</p>
            <h2 className="mb-4 mt-1 font-mono text-2xl font-bold text-foreground">{candidate.candidate_id}</h2>
            
            <div className="flex items-end justify-between border-t border-border pt-4">
              <div>
                <p className="text-xs text-muted-foreground">Final Score</p>
                <p className={cn("text-3xl font-black", scoreColorClass(candidate.final_score))}>
                  {formatScore(candidate.final_score)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Experience</p>
                <p className="text-xl font-bold text-muted-foreground">{reasons.matched_experience.toFixed(1)} <span className="text-sm font-normal text-muted-foreground">years</span></p>
              </div>
            </div>
          </div>

          {/* Radar Chart Card */}
          <div className="rounded-xl border border-border bg-surface p-6 shadow-lg">
            <h3 className="mb-6 text-sm font-semibold text-muted-foreground">Score Profile</h3>
            <RadarChart subScores={candidate.sub_scores} />
          </div>
        </div>

        {/* Right Column: Breakdown & Reasons */}
        <div className="space-y-6 lg:col-span-2">
          {/* Breakdown Card */}
          <div className="rounded-xl border border-border bg-surface p-6 shadow-lg">
            <h3 className="mb-6 text-base font-semibold text-muted-foreground">Dimension Breakdown</h3>
            <ScoreBreakdown subScores={candidate.sub_scores} />
          </div>

          {/* Skills Card */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-surface p-6 shadow-lg">
              <div className="mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-semibold text-muted-foreground">Top Matching Skills</h3>
              </div>
              {reasons.top_matching_skills?.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {reasons.top_matching_skills.map((s) => (
                    <span key={s} className="rounded-md bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      {s}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No specific top skills extracted.</p>
              )}
            </div>

            <div className="rounded-xl border border-border bg-surface p-6 shadow-lg">
              <div className="mb-4 flex items-center gap-2">
                <XCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                <h3 className="font-semibold text-muted-foreground">Missing Requirements</h3>
              </div>
              {reasons.missing_requirements?.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {reasons.missing_requirements.map((s) => (
                    <span key={s} className="rounded-md bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      {s}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No missing requirements identified.</p>
              )}
            </div>
          </div>

          {/* Why Candidate Matches */}
          <div className="rounded-xl border border-border bg-surface p-6 shadow-lg">
            <h3 className="mb-4 text-base font-semibold text-muted-foreground">AI Assessment: Why This Candidate Matches</h3>
            {reasons.why_candidate_matches?.length > 0 ? (
              <ul className="space-y-3">
                {reasons.why_candidate_matches.map((reason, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-[10px] font-bold text-accent-fg">
                      {i + 1}
                    </span>
                    {reason}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No assessment reasons available.</p>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
