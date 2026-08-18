import { apiFetch } from "./client";
import type { HealthResponse, VersionResponse } from "@/types/system";

/** GET /api/v1/health/ */
export async function getHealth(): Promise<HealthResponse> {
  return apiFetch<HealthResponse>("/api/v1/health/");
}

/** GET /api/v1/version/ */
export async function getVersion(): Promise<VersionResponse> {
  return apiFetch<VersionResponse>("/api/v1/version/");
}
