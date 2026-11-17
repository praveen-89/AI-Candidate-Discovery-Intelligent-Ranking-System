"use client";

import { useState } from "react";
import { User, AlertCircle, Clock, Trash2, Loader2 } from "lucide-react";
import { ScoreBreakdown } from "@/components/candidates/ScoreBreakdown";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { deleteResume } from "@/lib/api/resumes";
import { formatScore, scoreColorClass, formatTimestamp } from "@/lib/utils/format";
import type { ResumeRecord } from "@/types/resume";

interface ResumeResultCardProps {
  resume: ResumeRecord;
  onDeleted?: (resumeId: string) => void;
}

export function ResumeResultCard({ resume, onDeleted }: ResumeResultCardProps) {
  const { candidate, score_result, status } = resume;
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const handleDelete = async () => {
    if (!confirm(`Remove "${candidate?.profile.anonymized_name ?? resume.original_filename}" from this job?`)) {
      return;
    }
    setDeleting(true);
    setDeleteError("");
    try {
      await deleteResume(resume.resume_id);
      onDeleted?.(resume.resume_id);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete.");
      setDeleting(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-surface p-6 shadow-lg">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-border">
            <User className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground">
              {candidate?.profile.anonymized_name ?? resume.original_filename}
            </h4>
            <p className="text-xs text-muted-foreground">{candidate?.profile.headline || resume.original_filename}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={status} />
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-md p-1.5 text-muted-foreground transition hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-600 dark:text-red-400 disabled:opacity-50"
            aria-label="Remove resume"
            title="Remove resume"
          >
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {deleteError && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{deleteError}</p>}

      {status === "failed" && resume.error && (
        <div className="mt-4 flex gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {resume.error}
        </div>
      )}

      {candidate && (
        <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-muted-foreground sm:grid-cols-4">
          <div>
            <p className="text-muted-foreground">Experience</p>
            <p className="mt-0.5 font-medium text-muted-foreground">
              {candidate.profile.years_of_experience} yrs
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Current role</p>
            <p className="mt-0.5 truncate font-medium text-muted-foreground">
              {candidate.profile.current_title || "—"}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Education</p>
            <p className="mt-0.5 truncate font-medium text-muted-foreground">
              {candidate.education[0]?.degree ?? "—"}
            </p>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-3 w-3" />
            {formatTimestamp(resume.created_at)}
          </div>
        </div>
      )}

      {candidate && candidate.skills.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {candidate.skills.slice(0, 10).map((s) => (
            <span key={s.name} className="rounded-full bg-border px-2 py-0.5 text-[11px] text-muted-foreground">
              {s.name}
            </span>
          ))}
        </div>
      )}

      {score_result && (
        <div className="mt-6 border-t border-border pt-5">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Final Score</span>
            <span className={`text-2xl font-bold ${scoreColorClass(score_result.final_score)}`}>
              {formatScore(score_result.final_score)}
            </span>
          </div>

          <ScoreBreakdown subScores={score_result.sub_scores} />

          {score_result.reasons.why_candidate_matches.length > 0 && (
            <ul className="mt-5 space-y-1.5 text-xs text-muted-foreground">
              {score_result.reasons.why_candidate_matches.map((reason, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-accent-fg">•</span>
                  {reason}
                </li>
              ))}
            </ul>
          )}

          {score_result.reasons.missing_requirements.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-medium text-muted-foreground">Missing requirements</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {score_result.reasons.missing_requirements.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[11px] text-red-300"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
