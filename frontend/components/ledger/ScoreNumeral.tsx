import { cn } from "@/lib/utils/cn";

interface ScoreNumeralProps {
  /** 0–1 score. */
  value: number;
  /** "integer" shows 0–100 (list views); "decimal" shows 0.00–1.00 (dossier). */
  format?: "integer" | "decimal";
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZES = { sm: "text-base", md: "text-[22px]", lg: "text-[44px]" };

/**
 * Scores read like a newspaper headline — big, confident, serif, tabular
 * figures. Per the spec: integers in the leaderboard, decimals in the
 * dossier only.
 */
export function ScoreNumeral({ value, format = "integer", size = "md", className }: ScoreNumeralProps) {
  const display = format === "integer" ? Math.round(value * 100).toString() : value.toFixed(2);
  return (
    <span className={cn("font-serif font-semibold tabular-nums leading-none text-foreground", SIZES[size], className)}>
      {display}
    </span>
  );
}
