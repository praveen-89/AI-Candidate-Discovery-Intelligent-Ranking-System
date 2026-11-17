"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";
import { AppFrame } from "@/components/ledger/AppFrame";
import { FunnelRail } from "@/components/ledger/FunnelRail";
import { ScoreStrand } from "@/components/ledger/ScoreStrand";
import { ScoreNumeral } from "@/components/ledger/ScoreNumeral";
import { DistributionRibbon } from "@/components/ledger/DistributionRibbon";
import { SkillCoverageMatrix } from "@/components/ledger/SkillCoverageMatrix";
import { ErrorState } from "@/components/ui/ErrorState";
import { listJobs, createJob, getExistingMatches } from "@/lib/api/jobs";
import { formatTimestamp } from "@/lib/utils/format";
import type { JobRecord } from "@/types/job";
import type { CandidateResult } from "@/types/candidate";

const ACTIVE_JOB_STORAGE_KEY = "ledger.activeJobId";
const LEADERBOARD_SIZE = 25;
const POOL_FETCH_SIZE = 100;

export default function OverviewPage() {
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobsError, setJobsError] = useState<unknown>(null);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);

  const [candidates, setCandidates] = useState<CandidateResult[]>([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [candidatesError, setCandidatesError] = useState<unknown>(null);

  const [shortlistThreshold, setShortlistThreshold] = useState(70);

  const loadJobs = async () => {
    setJobsLoading(true);
    setJobsError(null);
    try {
      const data = await listJobs();
      const sorted = [...data].sort((a, b) => b.created_at.localeCompare(a.created_at));
      setJobs(sorted);
    } catch (err) {
      setJobsError(err);
    } finally {
      setJobsLoading(false);
    }
  };

  useEffect(() => {
    void loadJobs();
  }, []);

  // Resolves/self-heals the active job selection whenever the job list
  // changes: restores the last-selected job from localStorage if it still
  // exists, otherwise falls back to the most recent job. This runs
  // independently of the initial fetch so a stale/cleared activeJobId can
  // never strand the page on "no job selected" while jobs actually exist —
  // that bug previously showed the "create a job" empty state even when the
  // user already had jobs.
  useEffect(() => {
    if (jobs.length === 0) {
      setActiveJobId(null);
      return;
    }
    setActiveJobId((current) => {
      if (current && jobs.some((j) => j.job_id === current)) return current;
      const stored = window.localStorage.getItem(ACTIVE_JOB_STORAGE_KEY);
      const validStored = stored && jobs.some((j) => j.job_id === stored) ? stored : null;
      return validStored ?? jobs[0].job_id;
    });
  }, [jobs]);

  const handleJobSelect = (jobId: string) => {
    setActiveJobId(jobId);
    window.localStorage.setItem(ACTIVE_JOB_STORAGE_KEY, jobId);
  };

  useEffect(() => {
    if (!activeJobId) {
      setCandidates([]);
      return;
    }
    let cancelled = false;
    setCandidatesLoading(true);
    setCandidatesError(null);
    getExistingMatches(activeJobId, 1, POOL_FETCH_SIZE)
      .then((data) => {
        if (!cancelled) setCandidates(data.results);
      })
      .catch((err) => {
        if (!cancelled) setCandidatesError(err);
      })
      .finally(() => {
        if (!cancelled) setCandidatesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeJobId]);

  const activeJob = jobs.find((j) => j.job_id === activeJobId) ?? null;
  const leaderboard = candidates.slice(0, LEADERBOARD_SIZE);
  const scores = useMemo(() => candidates.map((c) => c.final_score), [candidates]);

  const shortlisted = useMemo(
    () => candidates.filter((c) => c.final_score * 100 >= shortlistThreshold).slice(0, 8),
    [candidates, shortlistThreshold]
  );

  const hardestToFind = useMemo(() => {
    if (!activeJob) return [];
    const counts = activeJob.structured_job.skills.map((skill) => {
      const missingCount = leaderboard.filter((c) =>
        c.reasons.missing_requirements.some((m) => m.toLowerCase() === skill.toLowerCase())
      ).length;
      return { skill, missingCount };
    });
    return counts
      .filter((c) => c.missingCount > 0)
      .sort((a, b) => b.missingCount - a.missingCount)
      .slice(0, 6);
  }, [activeJob, leaderboard]);

  if (jobsLoading) {
    return (
      <AppFrame pageTitle="Overview" jobs={jobs} activeJobId={activeJobId} onJobSelect={handleJobSelect}>
        <div className="flex h-full items-center justify-center text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      </AppFrame>
    );
  }

  if (jobsError) {
    return (
      <AppFrame pageTitle="Overview" jobs={jobs} activeJobId={activeJobId} onJobSelect={handleJobSelect}>
        <div className="p-6">
          <ErrorState error={jobsError} onRetry={loadJobs} />
        </div>
      </AppFrame>
    );
  }

  if (jobs.length === 0) {
    return (
      <AppFrame pageTitle="Overview" jobs={jobs} activeJobId={activeJobId} onJobSelect={handleJobSelect}>
        <EmptyJobPrompt onCreated={loadJobs} />
      </AppFrame>
    );
  }

  if (!activeJob) {
    // Jobs exist, but the active-job-resolution effect hasn't committed yet
    // (one render tick after `jobs` loads) — a brief loading state, never
    // the "create a job" prompt, since jobs genuinely already exist here.
    return (
      <AppFrame pageTitle="Overview" jobs={jobs} activeJobId={activeJobId} onJobSelect={handleJobSelect}>
        <div className="flex h-full items-center justify-center text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      </AppFrame>
    );
  }

  const { structured_job } = activeJob;

  return (
    <AppFrame pageTitle="Overview" jobs={jobs} activeJobId={activeJobId} onJobSelect={handleJobSelect}>
      {/* Job header */}
      <div className="border-b border-border px-6 py-5">
        <h2 className="font-serif text-[32px] font-semibold leading-tight text-foreground">{activeJob.title}</h2>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          {structured_job.experience_years != null && <span>{structured_job.experience_years}+ years</span>}
          {structured_job.industry && <span>{structured_job.industry}</span>}
          <span>Created {formatTimestamp(activeJob.created_at)}</span>
        </div>
        {structured_job.skills.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {structured_job.skills.map((skill) => (
              <span key={skill} className="rounded-[2px] border border-border px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
                {skill}
              </span>
            ))}
          </div>
        )}
      </div>

      <FunnelRail />

      {candidatesError ? (
        <div className="p-6">
          <ErrorState error={candidatesError} />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3">
          {/* Leaderboard */}
          <div className="border-b border-border lg:col-span-2 lg:border-b-0 lg:border-r">
            <div className="flex items-center justify-between border-b border-border px-6 py-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                Leaderboard
              </p>
              <p className="font-mono text-[11px] text-tertiary-foreground">
                top {leaderboard.length} of {candidates.length}
              </p>
            </div>

            {candidatesLoading ? (
              <div className="divide-y divide-border">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-[52px] animate-pulse bg-surface-hover/40" />
                ))}
              </div>
            ) : leaderboard.length === 0 ? (
              <p className="px-6 py-10 text-sm text-muted-foreground">
                No existing-pool candidates matched this job&apos;s requirements.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {leaderboard.map((c, i) => (
                  <li key={c.candidate_id} className="flex items-center gap-4 px-6 py-2.5 hover:bg-surface-hover">
                    <span className="w-5 shrink-0 font-mono text-xs text-tertiary-foreground">{i + 1}</span>
                    <span className="w-28 shrink-0 font-mono text-xs text-foreground">{c.candidate_id}</span>
                    <ScoreStrand candidate={c} className="w-40 shrink-0" />
                    <ScoreNumeral value={c.final_score} size="sm" className="w-9 shrink-0 text-right" />
                    <div className="flex min-w-0 flex-1 flex-wrap gap-1">
                      {c.reasons.top_matching_skills.slice(0, 3).map((s) => (
                        <span key={s} className="truncate rounded-[2px] bg-surface-hover px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                          {s}
                        </span>
                      ))}
                    </div>
                    {c.reasons.missing_requirements.length > 0 && (
                      <span className="shrink-0 font-mono text-[11px] text-caution">
                        −{c.reasons.missing_requirements.length}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Distribution + coverage */}
          <div className="divide-y divide-border">
            <div className="px-6 py-5">
              <DistributionRibbon scores={scores} value={shortlistThreshold} onChange={setShortlistThreshold} />
            </div>
            <div className="px-6 py-5">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                Skill coverage — shortlisted
              </p>
              {shortlisted.length === 0 ? (
                <p className="text-sm text-muted-foreground">No one is above the shortlist line yet.</p>
              ) : (
                <SkillCoverageMatrix
                  requiredSkills={structured_job.skills}
                  candidates={shortlisted.map((c) => ({ id: c.candidate_id, matchedSkills: c.reasons.top_matching_skills }))}
                />
              )}
            </div>
            <div className="px-6 py-5">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                Hardest to find
              </p>
              {hardestToFind.length === 0 ? (
                <p className="text-sm text-muted-foreground">No gaps — every required skill is covered.</p>
              ) : (
                <ul className="space-y-2">
                  {hardestToFind.map((h) => (
                    <li key={h.skill} className="flex items-center justify-between text-sm">
                      <span className="text-foreground">{h.skill}</span>
                      <span className="font-mono text-xs text-negative">missing in {h.missingCount}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </AppFrame>
  );
}

function EmptyJobPrompt({ onCreated }: { onCreated: () => void }) {
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !text.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      await createJob(title.trim(), text.trim());
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create job.");
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-full items-center justify-center px-6">
      <form onSubmit={handleSubmit} className="w-full max-w-lg">
        <h2 className="font-serif text-2xl font-semibold text-foreground">Paste a job description to start.</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Every screen is scoped to a job — nothing to see here until you create one.
        </p>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Job title"
          className="mt-5 w-full rounded-[6px] border border-border bg-input px-3 py-2 text-sm text-foreground outline-none focus:border-accent-fg"
        />
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste the job description..."
          rows={6}
          className="mt-3 w-full resize-y rounded-[6px] border border-border bg-input px-3 py-2 text-sm text-foreground outline-none focus:border-accent-fg"
        />
        <div className="mt-4 flex items-center gap-4">
          <button
            type="submit"
            disabled={submitting || !title.trim() || !text.trim()}
            className="flex items-center gap-2 rounded-[6px] bg-accent-fg px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Create job
            {!submitting && <ArrowRight className="h-3.5 w-3.5" />}
          </button>
          <Link href="/jobs" className="text-sm text-muted-foreground hover:text-foreground">
            or upload a file instead
          </Link>
        </div>
        {error && <p className="mt-3 text-sm text-negative">{error}</p>}
      </form>
    </div>
  );
}
