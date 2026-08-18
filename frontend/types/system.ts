// ============================================================
// Response from GET /api/v1/health/
// ============================================================
export interface HealthResponse {
  status: string;
  message: string;
}

// ============================================================
// Response from GET /api/v1/version/
// ============================================================
export interface VersionResponse {
  project: string;
  version: string;
  environment: string;
}

// ============================================================
// Response from GET /api/v1/cache/status
// ============================================================
export interface CacheStatusResponse {
  cache: boolean;
  vectors: number;
  model: string;
  dataset: string;
}

// ============================================================
// Response from GET /api/v1/ai/status
// ============================================================
export interface AIStatusResponse {
  engine: string;
  cache: string;
  vectors: number;
}
