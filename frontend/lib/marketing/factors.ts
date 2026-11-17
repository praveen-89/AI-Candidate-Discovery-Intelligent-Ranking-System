/**
 * The 8-factor hybrid scoring model — real weights from
 * ai_engine/src/config/settings.py (WEIGHT_*), matched to the fixed data
 * palette from the marketing design spec. Single source of truth for every
 * component that renders the Score Bar, factor cards, or the weight explorer.
 */
export interface ScoreFactor {
  key: string;
  label: string;
  weight: number;
  color: string;
  description: string;
}

export const SCORE_FACTORS: ScoreFactor[] = [
  {
    key: "semantic",
    label: "Semantic",
    weight: 0.3,
    color: "var(--color-factor-semantic)",
    description: "Embedding similarity between the candidate's profile and the job description.",
  },
  {
    key: "skill",
    label: "Skill",
    weight: 0.2,
    color: "var(--color-factor-skill)",
    description: "Overlap between the candidate's skills and the job's required skills.",
  },
  {
    key: "experience",
    label: "Experience",
    weight: 0.15,
    color: "var(--color-factor-experience)",
    description: "Years of experience against the job's stated requirement.",
  },
  {
    key: "career",
    label: "Career",
    weight: 0.1,
    color: "var(--color-factor-career)",
    description: "Career trajectory — span and progression across roles.",
  },
  {
    key: "behavioral",
    label: "Behavioral",
    weight: 0.1,
    color: "var(--color-factor-behavioral)",
    description: "Engagement signals — responsiveness, activity, and recency.",
  },
  {
    key: "education",
    label: "Education",
    weight: 0.05,
    color: "var(--color-factor-education)",
    description: "Institution tier and relevance of the candidate's education.",
  },
  {
    key: "availability",
    label: "Availability",
    weight: 0.05,
    color: "var(--color-factor-availability)",
    description: "Whether the candidate is currently open to new opportunities.",
  },
  {
    key: "location",
    label: "Location",
    weight: 0.05,
    color: "var(--color-factor-location)",
    description: "Proximity to a preferred or Tier-1 location.",
  },
];
