"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { JobRecord } from "@/types/job";

interface JobSwitcherProps {
  jobs: JobRecord[];
  activeJobId: string | null;
  onSelect: (jobId: string) => void;
}

/**
 * Persistent job switcher, top-left of the app frame. A score only means
 * something relative to a job, so the active job is the frame for every
 * screen — this is how it's chosen and changed.
 */
export function JobSwitcher({ jobs, activeJobId, onSelect }: JobSwitcherProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const activeJob = jobs.find((j) => j.job_id === activeJobId) ?? null;

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-[6px] border border-border bg-surface px-3 py-1.5 text-left transition hover:bg-surface-hover"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <Briefcase className="h-3.5 w-3.5 shrink-0 text-muted-foreground" strokeWidth={1.5} />
        <div className="leading-tight">
          <p className="max-w-[220px] truncate text-sm font-medium text-foreground">
            {activeJob ? activeJob.title : "No job selected"}
          </p>
          {activeJob && (
            <p className="font-mono text-[10px] text-tertiary-foreground">
              {activeJob.structured_job.skills.length} required skills
            </p>
          )}
        </div>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" strokeWidth={1.5} />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute left-0 top-full z-40 mt-1 max-h-80 w-72 overflow-y-auto rounded-[6px] border border-border bg-surface shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
        >
          {jobs.length === 0 ? (
            <p className="px-3 py-3 text-sm text-muted-foreground">No jobs yet.</p>
          ) : (
            jobs.map((job) => (
              <button
                key={job.job_id}
                role="option"
                aria-selected={job.job_id === activeJobId}
                onClick={() => {
                  onSelect(job.job_id);
                  setOpen(false);
                }}
                className={cn(
                  "block w-full truncate border-b border-border px-3 py-2 text-left text-sm last:border-b-0 hover:bg-surface-hover",
                  job.job_id === activeJobId ? "bg-surface-hover text-foreground" : "text-muted-foreground"
                )}
              >
                {job.title}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
