import type { CandidateResult } from "./candidate";

// ============================================================
// Matches ai_engine's resume_parser.py output shape
// (same structure as datasets/raw/candidate_schema.json)
// ============================================================
export interface ResumeCareerEntry {
  company: string;
  title: string;
  start_date: string | null;
  end_date: string | null;
  duration_months: number;
  is_current: boolean;
  industry: string;
  company_size: string;
  description: string;
}

export interface ResumeEducationEntry {
  institution: string;
  degree: string;
  field_of_study: string;
  start_year: number | null;
  end_year: number | null;
  grade: string | null;
  tier: string;
}

export interface ResumeSkill {
  name: string;
  proficiency: string;
  endorsements: number;
  duration_months: number;
}

export interface ParsedCandidateProfile {
  anonymized_name: string;
  headline: string;
  summary: string;
  location: string;
  country: string;
  years_of_experience: number;
  current_title: string;
  current_company: string;
  current_company_size: string;
  current_industry: string;
}

export interface ParsedCandidate {
  candidate_id: string;
  profile: ParsedCandidateProfile;
  career_history: ResumeCareerEntry[];
  education: ResumeEducationEntry[];
  skills: ResumeSkill[];
  certifications: unknown[];
  languages: unknown[];
  contact?: { email: string | null; phone: string | null };
}

export type ResumeStatus = "pending" | "parsed" | "scored" | "failed";

// ============================================================
// A single uploaded-resume record — matches local_store resume records
// ============================================================
export interface ResumeRecord {
  resume_id: string;
  job_id: string | null;
  original_filename: string;
  status: ResumeStatus;
  candidate: ParsedCandidate | null;
  score_result: CandidateResult | null;
  error: string | null;
  created_at: string;
  updated_at: string;
}
