"use client";

import { useRef, useState } from "react";
import { FileText, Type, UploadCloud, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { createJob, createJobFromFile } from "@/lib/api/jobs";
import { cn } from "@/lib/utils/cn";
import type { JobRecord } from "@/types/job";

type Mode = "text" | "file";
type SubmitState = "idle" | "submitting" | "success" | "error";

interface JobCreateFormProps {
  onCreated?: (job: JobRecord) => void;
}

const ALLOWED_EXTENSIONS = [".pdf", ".docx", ".txt"];

export function JobCreateForm({ onCreated }: JobCreateFormProps) {
  const [mode, setMode] = useState<Mode>("text");
  const [title, setTitle] = useState("");
  const [descriptionText, setDescriptionText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<SubmitState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canSubmit =
    title.trim().length > 0 &&
    (mode === "text" ? descriptionText.trim().length > 0 : file !== null) &&
    state !== "submitting";

  const resetForm = () => {
    setTitle("");
    setDescriptionText("");
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setState("submitting");
    setErrorMsg("");

    try {
      const job =
        mode === "text"
          ? await createJob(title.trim(), descriptionText.trim())
          : await createJobFromFile(title.trim(), file as File);

      setState("success");
      onCreated?.(job);
      resetForm();
      setTimeout(() => setState("idle"), 3000);
    } catch (err) {
      setState("error");
      setErrorMsg(err instanceof Error ? err.message : "Failed to create job.");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-border bg-surface p-6 shadow-lg"
    >
      <h3 className="text-base font-semibold text-foreground">Create a Job</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Define a company requirement — resumes get parsed and scored against it.
      </p>

      {/* Mode toggle */}
      <div className="mt-5 inline-flex rounded-lg border border-border bg-input p-1">
        <button
          type="button"
          onClick={() => setMode("text")}
          className={cn(
            "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition",
            mode === "text" ? "bg-violet-600 text-white" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Type className="h-3.5 w-3.5" />
          Paste text
        </button>
        <button
          type="button"
          onClick={() => setMode("file")}
          className={cn(
            "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition",
            mode === "file" ? "bg-violet-600 text-white" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <FileText className="h-3.5 w-3.5" />
          Upload file
        </button>
      </div>

      <div className="mt-4">
        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Job title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Senior ML Engineer"
          className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-violet-500"
        />
      </div>

      {mode === "text" ? (
        <div className="mt-4">
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Job description
          </label>
          <textarea
            value={descriptionText}
            onChange={(e) => setDescriptionText(e.target.value)}
            placeholder="Paste the full job description / requirements here..."
            rows={8}
            className="w-full resize-y rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-violet-500"
          />
        </div>
      ) : (
        <div className="mt-4">
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Job description file ({ALLOWED_EXTENSIONS.join(", ")})
          </label>
          <label
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-input px-4 py-8 text-center transition hover:border-violet-500/60",
              file && "border-violet-500/60 bg-violet-500/5"
            )}
          >
            <UploadCloud className="h-6 w-6 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {file ? file.name : "Click to choose a file, or drag it here"}
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept={ALLOWED_EXTENSIONS.join(",")}
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>
      )}

      <div className="mt-5 flex items-center gap-4">
        <button
          type="submit"
          disabled={!canSubmit}
          className={cn(
            "flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold shadow transition",
            canSubmit
              ? "bg-violet-600 text-white hover:bg-violet-500"
              : "cursor-not-allowed bg-border text-muted-foreground"
          )}
        >
          {state === "submitting" && <Loader2 className="h-4 w-4 animate-spin" />}
          {state === "success" && <CheckCircle2 className="h-4 w-4" />}
          {state === "error" && <XCircle className="h-4 w-4" />}
          {state === "submitting"
            ? "Creating..."
            : state === "success"
            ? "Created"
            : "Create Job"}
        </button>

        {state === "error" && errorMsg && (
          <p className="text-sm text-red-600 dark:text-red-400">{errorMsg}</p>
        )}
      </div>
    </form>
  );
}
