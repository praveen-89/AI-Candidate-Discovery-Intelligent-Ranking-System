"use client";

import { useRef, useState } from "react";
import { UploadCloud, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { uploadResume } from "@/lib/api/resumes";
import { cn } from "@/lib/utils/cn";
import type { ResumeRecord } from "@/types/resume";

type SubmitState = "idle" | "submitting" | "success" | "error";

const ALLOWED_EXTENSIONS = [".pdf", ".docx", ".txt"];

interface ResumeUploadFormProps {
  /** When provided, the resume is scored against this job immediately. */
  jobId?: string;
  onUploaded?: (resume: ResumeRecord) => void;
}

export function ResumeUploadForm({ jobId, onUploaded }: ResumeUploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<SubmitState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || state === "submitting") return;

    setState("submitting");
    setErrorMsg("");

    try {
      const resume = await uploadResume(file, jobId);
      setState("success");
      onUploaded?.(resume);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setTimeout(() => setState("idle"), 3000);
    } catch (err) {
      setState("error");
      setErrorMsg(err instanceof Error ? err.message : "Failed to upload resume.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-surface p-6 shadow-lg">
      <h3 className="text-base font-semibold text-foreground">Upload a Resume</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        {jobId
          ? "Parsed and scored against this job immediately."
          : "Parsed only — pick a job on the Jobs page to score it."}
      </p>

      <label
        className={cn(
          "mt-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-input px-4 py-8 text-center transition hover:border-violet-500/60",
          file && "border-violet-500/60 bg-violet-500/5"
        )}
      >
        <UploadCloud className="h-6 w-6 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          {file ? file.name : "Click to choose a resume, or drag it here"}
        </span>
        <span className="text-xs text-muted-foreground">{ALLOWED_EXTENSIONS.join(", ")} &middot; max 10MB</span>
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_EXTENSIONS.join(",")}
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </label>

      <div className="mt-5 flex items-center gap-4">
        <button
          type="submit"
          disabled={!file || state === "submitting"}
          className={cn(
            "flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold shadow transition",
            file && state !== "submitting"
              ? "bg-violet-600 text-white hover:bg-violet-500"
              : "cursor-not-allowed bg-border text-muted-foreground"
          )}
        >
          {state === "submitting" && <Loader2 className="h-4 w-4 animate-spin" />}
          {state === "success" && <CheckCircle2 className="h-4 w-4" />}
          {state === "error" && <XCircle className="h-4 w-4" />}
          {state === "submitting" ? "Processing..." : state === "success" ? "Uploaded" : "Upload & Score"}
        </button>

        {state === "error" && errorMsg && <p className="text-sm text-red-600 dark:text-red-400">{errorMsg}</p>}
      </div>
    </form>
  );
}
