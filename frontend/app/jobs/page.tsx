"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { JobCreateForm } from "@/components/jobs/JobCreateForm";
import { JobCard } from "@/components/jobs/JobCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { listJobs } from "@/lib/api/jobs";
import { Briefcase } from "lucide-react";
import type { JobRecord } from "@/types/job";

export default function JobsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [jobs, setJobs] = useState<JobRecord[]>([]);

  const loadJobs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listJobs();
      setJobs([...data].sort((a, b) => b.created_at.localeCompare(a.created_at)));
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadJobs();
  }, []);

  return (
    <AppShell pageTitle="Jobs">
      <div className="mx-auto max-w-4xl pt-4">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground">Job Requirements</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Create a job from a pasted description or an uploaded file, then upload
            resumes to score against it.
          </p>
        </div>

        <JobCreateForm onCreated={() => void loadJobs()} />

        <div className="mt-10">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Existing Jobs
          </h3>

          {loading ? (
            <div className="space-y-3">
              <SkeletonCard lines={2} />
              <SkeletonCard lines={2} />
            </div>
          ) : error ? (
            <ErrorState error={error} onRetry={loadJobs} />
          ) : jobs.length === 0 ? (
            <EmptyState
              icon={Briefcase}
              title="No jobs yet"
              message="Create your first job above to start scoring resumes against it."
            />
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => (
                <JobCard key={job.job_id} job={job} />
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
