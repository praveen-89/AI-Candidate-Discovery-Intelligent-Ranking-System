import { apiFetch } from "./client";
import type { StandardResponse } from "@/types/api";
import type { SubmissionData, CandidateResult } from "@/types/candidate";

/** GET /api/v1/results — full ranked candidate list */
export async function getResults(): Promise<SubmissionData> {
  const res = await apiFetch<StandardResponse<SubmissionData>>("/api/v1/results");
  return res.data;
}

/** GET /api/v1/results/{candidate_id} — single candidate */
export async function getCandidate(candidateId: string): Promise<CandidateResult> {
  const res = await apiFetch<StandardResponse<CandidateResult>>(
    `/api/v1/results/${encodeURIComponent(candidateId)}`
  );
  return res.data;
}
