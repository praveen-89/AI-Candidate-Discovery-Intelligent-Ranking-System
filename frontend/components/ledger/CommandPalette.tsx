"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Briefcase, LayoutGrid, Users, Upload, PlayCircle, Settings } from "lucide-react";
import type { JobRecord } from "@/types/job";

interface CommandPaletteProps {
  jobs: JobRecord[];
  onSelectJob: (jobId: string) => void;
}

interface Action {
  id: string;
  label: string;
  hint?: string;
  icon: typeof Briefcase;
  run: () => void;
}

/**
 * ⌘K / Ctrl+K command palette — jump to a candidate ID (future round, once
 * there's a global candidate lookup endpoint), switch job, or jump to a
 * screen. Keyboard-first per the redesign spec.
 */
export function CommandPalette({ jobs, onSelectJob }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const actions: Action[] = useMemo(() => {
    const navActions: Action[] = [
      { id: "nav-overview", label: "Go to Overview", icon: LayoutGrid, run: () => router.push("/dashboard") },
      { id: "nav-candidates", label: "Go to Candidates", icon: Users, run: () => router.push("/candidates") },
      { id: "nav-jobs", label: "Go to Jobs", icon: Briefcase, run: () => router.push("/jobs") },
      { id: "nav-uploads", label: "Go to Uploads", icon: Upload, run: () => router.push("/uploads") },
      { id: "nav-runs", label: "Go to Runs", icon: PlayCircle, run: () => router.push("/ranking") },
      { id: "nav-system", label: "Go to System", icon: Settings, run: () => router.push("/system") },
    ];
    const jobActions: Action[] = jobs.map((j) => ({
      id: `job-${j.job_id}`,
      label: j.title,
      hint: "Switch job",
      icon: Briefcase,
      run: () => onSelectJob(j.job_id),
    }));
    return [...navActions, ...jobActions];
  }, [jobs, router, onSelectJob]);

  const filtered = actions.filter((a) => a.label.toLowerCase().includes(query.toLowerCase()));

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/30 pt-[15vh]" onClick={() => setOpen(false)}>
      <div
        className="w-full max-w-md overflow-hidden rounded-[6px] border border-border bg-surface shadow-[0_8px_24px_rgba(0,0,0,0.18)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.5} />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Switch job, jump to a screen…"
            className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-tertiary-foreground"
            onKeyDown={(e) => {
              if (e.key === "Enter" && filtered[0]) {
                filtered[0].run();
                setOpen(false);
              }
            }}
          />
          <kbd className="rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-tertiary-foreground">
            ESC
          </kbd>
        </div>
        <div className="max-h-80 overflow-y-auto py-1">
          {filtered.length === 0 ? (
            <p className="px-3 py-3 text-sm text-muted-foreground">No matches.</p>
          ) : (
            filtered.map((action) => (
              <button
                key={action.id}
                onClick={() => {
                  action.run();
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-foreground hover:bg-surface-hover"
              >
                <action.icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" strokeWidth={1.5} />
                <span className="truncate">{action.label}</span>
                {action.hint && <span className="ml-auto text-xs text-tertiary-foreground">{action.hint}</span>}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
