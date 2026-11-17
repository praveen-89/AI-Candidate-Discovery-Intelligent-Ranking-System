"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { ArrowLeft, Briefcase, Users, Database } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { ResumeUploadForm } from "@/components/resumes/ResumeUploadForm";
import { ResumeResultCard } from "@/components/resumes/ResumeResultCard";
import { ExistingMatchCard } from "@/components/jobs/ExistingMatchCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Pagination } from "@/components/ui/Pagination";
import { SkeletonDetail, SkeletonCard } from "@/components/ui/SkeletonCard";
import { getJob, getJobResults, getExistingMatches } from "@/lib/api/jobs";
import { cn } from "@/lib/utils/cn";
import type { JobRecord } from "@/types/job";
import type { ResumeRecord } from "@/types/resume";
import type { CandidateResult } from "@/types/candidate";

type ResultsTab = "uploaded" | "existing";

export default function JobDetailPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = use(params);
  const decodedId = decodeURIComponent(jobId);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [job, setJob] = useState<JobRecord | null>(null);
  const [results, setResults] = useState<ResumeRecord[]>([]);

  const EXISTING_PAGE_SIZE = 10;
  const [tab, setTab] = useState<ResultsTab>("existing");
  const [existingMatches, setExistingMatches] = useState<CandidateResult[]>([]);
  const [existingTotal, setExistingTotal] = useState(0);
  const [existingPage, setExistingPage] = useState(1);
  const [existingLoading, setExistingLoading] = useState(true);
  const [existingError, setExistingError] = useState<unknown>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [jobData, resultsData] = await Promise.all([
        getJob(decodedId),
        getJobResults(decodedId),
      ]);
      setJob(jobData);
      setResults(resultsData);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const loadExistingMatches = async (page: number = existingPage) => {
    setExistingLoading(true);
    setExistingError(null);
    try {
      const data = await getExistingMatches(decodedId, page, EXISTING_PAGE_SIZE);
      setExistingMatches(data.results);
      setExistingTotal(data.total);
      setExistingPage(data.page);
    } catch (err) {
      setExistingError(err);
    } finally {
      setExistingLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
    void loadExistingMatches(1);
  }, [decodedId]);

  if (error) {
    return (
      <AppShell pageTitle="Job Details">
        <ErrorState error={error} onRetry={loadData} />
      </AppShell>
    );
  }

  if (loading || !job) {
    return (
      <AppShell pageTitle="Job Details">
        <SkeletonDetail />
      </AppShell>
    );
  }

  const { structured_job } = job;

  return (
    <AppShell pageTitle="Job Details">
      <div className="mb-6">
        <Link
          href="/jobs"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition hover:text-accent-fg"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Jobs
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: job summary + upload — sticks in place while the candidate list on the right scrolls */}
        <div className="space-y-6 lg:col-span-1 lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-xl border border-border bg-surface p-6 shadow-lg">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-violet-500/10 border border-violet-500/20">
              <Briefcase className="h-7 w-7 text-accent-fg" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Job</p>
            <h2 className="mt-1 text-xl font-bold text-foreground">{job.title}</h2>

            {structured_job.experience_years != null && (
              <p className="mt-2 text-sm text-muted-foreground">
                {structured_job.experience_years}+ years experience
              </p>
            )}

            {structured_job.skills.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {structured_job.skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full bg-border px-2 py-0.5 text-[11px] text-muted-foreground"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>

          <ResumeUploadForm
            jobId={job.job_id}
            onUploaded={(resume) => setResults((prev) => [resume, ...prev])}
          />
        </div>

        {/* Right: results */}
        <div className="space-y-4 lg:col-span-2">
          <div className="inline-flex rounded-lg border border-border bg-input p-1">
            <button
              onClick={() => setTab("existing")}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition",
                tab === "existing" ? "bg-violet-600 text-white" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Database className="h-3.5 w-3.5" />
              Existing Candidates ({existingTotal})
            </button>
            <button
              onClick={() => setTab("uploaded")}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition",
                tab === "uploaded" ? "bg-violet-600 text-white" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Users className="h-3.5 w-3.5" />
              Uploaded Resumes ({results.length})
            </button>
          </div>

          {tab === "existing" ? (
            existingLoading ? (
              <div className="space-y-4">
                <SkeletonCard lines={3} />
                <SkeletonCard lines={3} />
              </div>
            ) : existingError ? (
              <ErrorState error={existingError} onRetry={loadExistingMatches} />
            ) : existingMatches.length === 0 ? (
              <EmptyState
                icon={Database}
                title="No matches found"
                message="No existing candidates in the pool matched this job's requirements."
              />
            ) : (
              <div className="space-y-4">
                {existingMatches.map((candidate, i) => (
                  <ExistingMatchCard
                    key={candidate.candidate_id}
                    candidate={candidate}
                    rank={(existingPage - 1) * EXISTING_PAGE_SIZE + i + 1}
                  />
                ))}

                <Pagination
                  page={existingPage}
                  pageSize={EXISTING_PAGE_SIZE}
                  total={existingTotal}
                  onPageChange={(p) => void loadExistingMatches(p)}
                  disabled={existingLoading}
                />
              </div>
            )
          ) : results.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No resumes yet"
              message="Upload a resume on the left to see it parsed and scored against this job."
            />
          ) : (
            <div className="space-y-4">
              {results.map((resume) => (
                <ResumeResultCard
                  key={resume.resume_id}
                  resume={resume}
                  onDeleted={(resumeId) =>
                    setResults((prev) => prev.filter((r) => r.resume_id !== resumeId))
                  }
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
