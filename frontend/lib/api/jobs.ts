import { apiFetch, apiUpload } from "./client";
import type { StandardResponse } from "@/types/api";
import type { JobRecord } from "@/types/job";
import type { ResumeRecord } from "@/types/resume";
import type { CandidateResult } from "@/types/candidate";

/** POST /api/v1/jobs — create a job from pasted description text */
export async function createJob(title: string, descriptionText: string): Promise<JobRecord> {
  const res = await apiFetch<StandardResponse<JobRecord>>("/api/v1/jobs", {
    method: "POST",
    body: JSON.stringify({ title, description_text: descriptionText }),
  });
  return res.data;
}

/** POST /api/v1/jobs/upload — create a job from an uploaded JD file (.pdf/.docx/.txt) */
export async function createJobFromFile(title: string, file: File): Promise<JobRecord> {
  const form = new FormData();
  form.append("title", title);
  form.append("file", file);
  const res = await apiUpload<StandardResponse<JobRecord>>("/api/v1/jobs/upload", form);
  return res.data;
}

/** GET /api/v1/jobs — list all created jobs */
export async function listJobs(): Promise<JobRecord[]> {
  const res = await apiFetch<StandardResponse<JobRecord[]>>("/api/v1/jobs");
  return res.data;
}

/** GET /api/v1/jobs/{job_id} */
export async function getJob(jobId: string): Promise<JobRecord> {
  const res = await apiFetch<StandardResponse<JobRecord>>(`/api/v1/jobs/${encodeURIComponent(jobId)}`);
  return res.data;
}

/** GET /api/v1/jobs/{job_id}/results — resumes scored against this job, best first */
export async function getJobResults(jobId: string): Promise<ResumeRecord[]> {
  const res = await apiFetch<StandardResponse<ResumeRecord[]>>(
    `/api/v1/jobs/${encodeURIComponent(jobId)}/results`
  );
  return res.data;
}

export interface ExistingMatchesPage {
  results: CandidateResult[];
  total: number;
  page: number;
  page_size: number;
}

/**
 * GET /api/v1/jobs/{job_id}/existing-matches — ranks existing base-pool (100k)
 * candidates against this job. No upload required; searches the live FAISS index.
 * Paginated: `page` is 1-indexed.
 */
export async function getExistingMatches(
  jobId: string,
  page = 1,
  pageSize = 10
): Promise<ExistingMatchesPage> {
  const res = await apiFetch<StandardResponse<ExistingMatchesPage>>(
    `/api/v1/jobs/${encodeURIComponent(jobId)}/existing-matches?page=${page}&page_size=${pageSize}`
  );
  return res.data;
}
