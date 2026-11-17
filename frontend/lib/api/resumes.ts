import { apiFetch, apiUpload } from "./client";
import type { StandardResponse } from "@/types/api";
import type { ResumeRecord } from "@/types/resume";

/**
 * POST /api/v1/resumes/upload — upload a resume (.pdf/.docx/.txt).
 * If `jobId` is provided, the resume is scored against that job immediately;
 * otherwise it's parsed only (status "parsed", no score_result).
 */
export async function uploadResume(file: File, jobId?: string): Promise<ResumeRecord> {
  const form = new FormData();
  form.append("file", file);
  if (jobId) form.append("job_id", jobId);
  const res = await apiUpload<StandardResponse<ResumeRecord>>("/api/v1/resumes/upload", form);
  return res.data;
}

/** GET /api/v1/resumes/{resume_id} */
export async function getResume(resumeId: string): Promise<ResumeRecord> {
  const res = await apiFetch<StandardResponse<ResumeRecord>>(
    `/api/v1/resumes/${encodeURIComponent(resumeId)}`
  );
  return res.data;
}

/** DELETE /api/v1/resumes/{resume_id} */
export async function deleteResume(resumeId: string): Promise<void> {
  await apiFetch<StandardResponse<null>>(`/api/v1/resumes/${encodeURIComponent(resumeId)}`, {
    method: "DELETE",
  });
}
