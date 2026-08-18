import { apiFetch } from "./client";
import type { CacheStatusResponse, AIStatusResponse } from "@/types/system";

/** GET /api/v1/cache/status */
export async function getCacheStatus(): Promise<CacheStatusResponse> {
  return apiFetch<CacheStatusResponse>("/api/v1/cache/status");
}

/** GET /api/v1/ai/status */
export async function getAIStatus(): Promise<AIStatusResponse> {
  return apiFetch<AIStatusResponse>("/api/v1/ai/status");
}
