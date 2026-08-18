import { apiFetch } from "./client";
import type { StandardResponse } from "@/types/api";
import type { RankingRunResult, ManifestData } from "@/types/ranking";

/**
 * POST /api/v1/rank
 * Triggers the AI inference pipeline.
 * NOTE: No request body is accepted — backend reads job_description.docx internally.
 */
export async function runRanking(): Promise<RankingRunResult> {
  const res = await apiFetch<StandardResponse<RankingRunResult>>("/api/v1/rank", {
    method: "POST",
  });
  return res.data;
}

/** GET /api/v1/manifest */
export async function getManifest(): Promise<ManifestData> {
  const res = await apiFetch<StandardResponse<ManifestData>>("/api/v1/manifest");
  return res.data;
}
