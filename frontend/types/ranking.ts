// ============================================================
// Response data from POST /api/v1/rank
// Wrapped in StandardResponse
// ============================================================
export interface RankingRunResult {
  status: string;
  processing_time: number;
  total_candidates: number;
  top_candidates: number;
}

// ============================================================
// Manifest returned by GET /api/v1/manifest
// Matches ai_engine/outputs/manifest.json
// ============================================================
export interface ManifestData {
  dataset_version: string;
  model_used: string;
  run_timestamp_utc: string;
  total_candidates_processed: number;
  end_to_end_latency_seconds: number;
}
