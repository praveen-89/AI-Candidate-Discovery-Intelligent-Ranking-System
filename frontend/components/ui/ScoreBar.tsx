"use client";

import { scoreBarBgClass } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

interface ScoreBarProps {
  label: string;
  score: number; // 0-1
  showPercentage?: boolean;
  className?: string;
}

export function ScoreBar({
  label,
  score,
  showPercentage = true,
  className,
}: ScoreBarProps) {
  const pct = Math.round(score * 100 * 10) / 10;
  const barWidth = `${pct}%`;

  return (
    <div className={cn("w-full", className)}>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="font-medium text-muted-foreground">{label}</span>
        {showPercentage && (
          <span className="text-xs font-semibold text-muted-foreground">{pct}%</span>
        )}
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-border">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-700 ease-out",
            scoreBarBgClass(score)
          )}
          style={{ width: barWidth }}
        />
      </div>
    </div>
  );
}
