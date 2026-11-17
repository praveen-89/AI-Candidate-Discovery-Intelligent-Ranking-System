"use client";

import { motion, useReducedMotion } from "framer-motion";
import { StatCounter } from "./StatCounter";
import { cn } from "@/lib/utils/cn";

const STAGES = [
  { value: 100000, label: "Candidate pool" },
  { value: 5000, label: "Dense retrieval" },
  { value: 1000, label: "Pre-rank" },
  { value: 100, label: "Ranked + explained" },
];

/**
 * The retrieval funnel — 100,000 → 5,000 → 1,000 → 100. The product's
 * signature story, told as four shrinking bars with counting numbers.
 */
export function FunnelViz({ className }: { className?: string }) {
  const prefersReducedMotion = useReducedMotion();
  const maxValue = STAGES[0].value;

  return (
    <div className={cn("w-full", className)}>
      <div className="grid grid-cols-4 gap-3 sm:gap-4">
        {STAGES.map((stage, i) => {
          // Widths on a sqrt scale so the funnel narrows visibly without the
          // later bars becoming invisibly thin.
          const widthPct = Math.max(18, Math.sqrt(stage.value / maxValue) * 100);
          return (
            <div key={stage.label} className="flex flex-col items-center gap-3">
              <div className="flex h-24 w-full items-end justify-center sm:h-32">
                <motion.div
                  initial={prefersReducedMotion ? false : { height: "0%" }}
                  whileInView={prefersReducedMotion ? undefined : { height: "100%" }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.15, ease: "easeOut" }}
                  className="flex items-start justify-center rounded-t-md bg-mkt-accent"
                  style={{ width: `${widthPct}%` }}
                />
              </div>
              <div className="text-center">
                <p className="font-mono text-lg font-semibold tabular-nums text-mkt-text sm:text-2xl">
                  <StatCounter value={stage.value} />
                </p>
                <p className="mt-0.5 text-[11px] leading-tight text-mkt-text-secondary sm:text-xs">
                  {stage.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="relative mt-1 h-px w-full bg-mkt-border">
        <ArrowFlow />
      </div>
    </div>
  );
}

function ArrowFlow() {
  return (
    <div className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-between px-[11%]">
      {[0, 1, 2].map((i) => (
        <span key={i} className="text-mkt-border">
          →
        </span>
      ))}
    </div>
  );
}
