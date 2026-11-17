"use client";

import Link from "next/link";
import { Briefcase, ChevronRight } from "lucide-react";
import { formatTimestamp } from "@/lib/utils/format";
import type { JobRecord } from "@/types/job";

export function JobCard({ job }: { job: JobRecord }) {
  const { structured_job } = job;

  return (
    <Link
      href={`/jobs/${encodeURIComponent(job.job_id)}`}
      className="group flex items-center justify-between rounded-xl border border-border bg-surface p-5 shadow transition hover:border-violet-500/40 hover:bg-surface-hover"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Briefcase className="h-4 w-4 shrink-0 text-accent-fg" />
          <h4 className="truncate text-sm font-semibold text-foreground">{job.title}</h4>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Created {formatTimestamp(job.created_at)}
          {structured_job.experience_years != null && (
            <> &middot; {structured_job.experience_years}+ yrs</>
          )}
        </p>
        {structured_job.skills.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {structured_job.skills.slice(0, 6).map((skill) => (
              <span
                key={skill}
                className="rounded-full bg-border px-2 py-0.5 text-[11px] text-muted-foreground"
              >
                {skill}
              </span>
            ))}
            {structured_job.skills.length > 6 && (
              <span className="rounded-full bg-border px-2 py-0.5 text-[11px] text-muted-foreground">
                +{structured_job.skills.length - 6} more
              </span>
            )}
          </div>
        )}
      </div>
      <ChevronRight className="ml-4 h-4 w-4 shrink-0 text-muted-foreground transition group-hover:text-accent-fg" />
    </Link>
  );
}
