"use client";

import { ScoreBar } from "@/components/ui/ScoreBar";
import { SUB_SCORE_LABELS } from "@/lib/utils/format";
import type { SubScores } from "@/types/candidate";

interface ScoreBreakdownProps {
  subScores: SubScores;
}

export function ScoreBreakdown({ subScores }: ScoreBreakdownProps) {
  const scores = Object.entries(subScores).map(([key, val]) => ({
    key,
    label: SUB_SCORE_LABELS[key] || key,
    val,
  }));

  // Sort by score descending
  scores.sort((a, b) => b.val - a.val);

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
      {scores.map(({ key, label, val }) => (
        <ScoreBar key={key} label={label} score={val} />
      ))}
    </div>
  );
}
