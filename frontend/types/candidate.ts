// ============================================================
// Sub-scores for each of the 8 ranking dimensions
// Matches submission.json → results[n].sub_scores
// ============================================================
export interface SubScores {
  semantic: number;
  skill: number;
  experience: number;
  career: number;
  education: number;
  behavioral: number;
  availability: number;
  location: number;
}

// ============================================================
// Percentage contribution from each dimension to final score
// Matches submission.json → results[n].reasons.ranking_score_breakdown
// ============================================================
export interface RankingScoreBreakdown {
  semantic_contribution_pct: number;
  skill_contribution_pct: number;
  experience_contribution_pct: number;
  career_contribution_pct: number;
  education_contribution_pct: number;
  behavioral_contribution_pct: number;
  availability_contribution_pct: number;
  location_contribution_pct: number;
}

// ============================================================
// Human-readable ranking reasons
// Matches submission.json → results[n].reasons
// ============================================================
export interface CandidateReasons {
  top_matching_skills: string[];
  missing_requirements: string[];
  matched_experience: number;
  why_candidate_matches: string[];
  ranking_score_breakdown: RankingScoreBreakdown;
}

// ============================================================
// Full candidate result object
// Matches submission.json → results[n]
// ============================================================
export interface CandidateResult {
  candidate_id: string;
  final_score: number;
  sub_scores: SubScores;
  reasons: CandidateReasons;
}

// ============================================================
// Full submission object returned by GET /api/v1/results
// ============================================================
export interface SubmissionData {
  results: CandidateResult[];
}
