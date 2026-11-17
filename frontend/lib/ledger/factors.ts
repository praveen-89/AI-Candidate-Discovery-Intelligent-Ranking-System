/**
 * The 8-factor hybrid scoring model, for the dashboard's "Shortlist Ledger"
 * redesign. Real weights from ai_engine/src/config/settings.py (WEIGHT_*).
 * Matches CandidateResult.sub_scores / reasons.ranking_score_breakdown keys.
 */
export interface LedgerFactor {
  key: "semantic" | "skill" | "experience" | "career" | "behavioral" | "education" | "availability" | "location";
  label: string;
  weight: number;
  color: string;
}

export const LEDGER_FACTORS: LedgerFactor[] = [
  { key: "semantic", label: "Semantic", weight: 0.3, color: "var(--color-ledger-semantic)" },
  { key: "skill", label: "Skill", weight: 0.2, color: "var(--color-ledger-skill)" },
  { key: "experience", label: "Experience", weight: 0.15, color: "var(--color-ledger-experience)" },
  { key: "career", label: "Career", weight: 0.1, color: "var(--color-ledger-career)" },
  { key: "behavioral", label: "Behavioral", weight: 0.1, color: "var(--color-ledger-behavioral)" },
  { key: "education", label: "Education", weight: 0.05, color: "var(--color-ledger-education)" },
  { key: "availability", label: "Availability", weight: 0.05, color: "var(--color-ledger-availability)" },
  { key: "location", label: "Location", weight: 0.05, color: "var(--color-ledger-location)" },
];

export function factorColor(key: string): string {
  return LEDGER_FACTORS.find((f) => f.key === key)?.color ?? "var(--muted-foreground)";
}
