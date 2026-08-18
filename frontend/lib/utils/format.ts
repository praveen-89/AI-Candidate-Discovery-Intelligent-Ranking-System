/**
 * Formatting utilities for the AI Talent Intelligence Platform.
 */

/** Format a decimal score (0–1) as a percentage string. e.g. 0.7032 → "70.3%" */
export function formatScore(score: number): string {
  return `${(score * 100).toFixed(1)}%`;
}

/** Format a decimal score as a 0-100 percentage number. e.g. 0.7032 → 70.3 */
export function scoreTo100(score: number): number {
  return Math.round(score * 1000) / 10;
}

/** Format a large number with commas. e.g. 100000 → "100,000" */
export function formatNumber(n: number): string {
  return n.toLocaleString("en-IN");
}

/** Format a UTC ISO timestamp to a readable local date-time string. */
export function formatTimestamp(isoString: string): string {
  try {
    return new Date(isoString).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return isoString;
  }
}

/** Format a latency number as seconds string. e.g. 16.09 → "16.09s" */
export function formatLatency(seconds: number): string {
  return `${seconds.toFixed(2)}s`;
}

/** Clamp a number between min and max. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Return a colour class based on a 0–1 score. */
export function scoreColorClass(score: number): string {
  if (score >= 0.75) return "text-emerald-400";
  if (score >= 0.5) return "text-amber-400";
  return "text-red-400";
}

/** Return a background colour class for score bars. */
export function scoreBarBgClass(score: number): string {
  if (score >= 0.75) return "bg-emerald-500";
  if (score >= 0.5) return "bg-amber-500";
  return "bg-red-500";
}

/**
 * Human-readable label for sub-score dimension keys.
 */
export const SUB_SCORE_LABELS: Record<string, string> = {
  semantic: "Semantic",
  skill: "Skill Match",
  experience: "Experience",
  career: "Career",
  education: "Education",
  behavioral: "Behavioral",
  availability: "Availability",
  location: "Location",
};
