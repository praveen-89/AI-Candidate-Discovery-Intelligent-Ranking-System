"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils/cn";

export interface PipelineStep {
  number: string;
  title: string;
  input: string;
  process: string;
  output: string;
  snippet?: string;
}

/** An interactive horizontal stepper — click a step to expand its detail. */
export function PipelineStepper({ steps }: { steps: PipelineStep[] }) {
  const [active, setActive] = useState(0);
  const step = steps[active];

  return (
    <div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        {steps.map((s, i) => (
          <button
            key={s.number}
            onClick={() => setActive(i)}
            className={cn(
              "rounded-md border px-3 py-3 text-left transition",
              i === active
                ? "border-mkt-accent bg-mkt-surface"
                : "border-mkt-border hover:border-mkt-text-secondary"
            )}
          >
            <p className="font-mono text-xs text-mkt-text-secondary">{s.number}</p>
            <p className={cn("mt-1 text-xs font-medium", i === active ? "text-mkt-accent" : "text-mkt-text")}>
              {s.title}
            </p>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
          className="mt-6 rounded-xl border border-mkt-border bg-mkt-surface p-6"
        >
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <DetailBlock label="Input" value={step.input} />
            <DetailBlock label="Process" value={step.process} />
            <DetailBlock label="Output" value={step.output} />
          </div>
          {step.snippet && (
            <pre className="mt-5 overflow-x-auto rounded-md border border-mkt-border bg-mkt-bg p-3 font-mono text-xs text-mkt-text-secondary">
              {step.snippet}
            </pre>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function DetailBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-mkt-text-secondary">{label}</p>
      <p className="mt-1.5 text-sm leading-relaxed text-mkt-text">{value}</p>
    </div>
  );
}
