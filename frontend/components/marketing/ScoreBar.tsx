"use client";

import { motion, useReducedMotion } from "framer-motion";
import { SCORE_FACTORS, type ScoreFactor } from "@/lib/marketing/factors";
import { cn } from "@/lib/utils/cn";

interface ScoreBarProps {
  /** Per-factor weights to render (0–1, should sum to ~1). Defaults to the real model weights. */
  weights?: Record<string, number>;
  height?: "sm" | "md" | "lg";
  showLabels?: boolean;
  className?: string;
}

const HEIGHTS = { sm: "h-2", md: "h-3", lg: "h-5" };

/**
 * The 8-segment Score Bar — the product's brand mark. One horizontal bar,
 * split into the 8 fixed factor colors, each segment's width proportional to
 * its weight. Used in the hero, on cards, and as section dividers.
 */
export function ScoreBar({ weights, height = "md", showLabels = false, className }: ScoreBarProps) {
  const prefersReducedMotion = useReducedMotion();
  const effective = SCORE_FACTORS.map((f) => ({
    ...f,
    weight: weights?.[f.key] ?? f.weight,
  }));

  return (
    <div className={cn("w-full", className)}>
      <div className={cn("flex w-full overflow-hidden rounded-full bg-mkt-border", HEIGHTS[height])}>
        {effective.map((factor, i) => (
          <motion.div
            key={factor.key}
            initial={prefersReducedMotion ? false : { scaleX: 0 }}
            whileInView={prefersReducedMotion ? undefined : { scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.04, ease: "easeOut" }}
            style={{
              width: `${factor.weight * 100}%`,
              backgroundColor: factor.color,
              transformOrigin: "left",
            }}
            title={`${factor.label}: ${Math.round(factor.weight * 100)}%`}
          />
        ))}
      </div>
      {showLabels && (
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
          {effective.map((factor) => (
            <FactorLegendItem key={factor.key} factor={factor} />
          ))}
        </div>
      )}
    </div>
  );
}

function FactorLegendItem({ factor }: { factor: ScoreFactor & { weight: number } }) {
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: factor.color }} />
      <span className="text-mkt-text-secondary">{factor.label}</span>
      <span className="font-mono text-mkt-text-secondary">
        {Math.round(factor.weight * 100)}%
      </span>
    </div>
  );
}
