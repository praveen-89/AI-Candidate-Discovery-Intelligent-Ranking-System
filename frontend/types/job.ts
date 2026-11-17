// ============================================================
// Structured job requirements produced by ai_engine's JobParser
// Matches backend structured_job shape
// ============================================================
export interface StructuredJob {
  job_id: string;
  title: string;
  skills: string[];
  experience_years: number | null;
  industry: string;
  responsibilities: string[];
  semantic_query: string;
}

// ============================================================
// A created job (company requirement) — matches local_store job records
// ============================================================
export interface JobRecord {
  job_id: string;
  title: string;
  structured_job: StructuredJob;
  source_file_path?: string | null;
  created_at: string;
}
