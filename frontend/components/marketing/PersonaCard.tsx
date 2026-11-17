"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

export interface Persona {
  icon: LucideIcon;
  role: string;
  problem: string;
  solution: string;
  feature: string;
}

export function PersonaCard({ persona, delay = 0 }: { persona: Persona; delay?: number }) {
  const Icon = persona.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className="rounded-xl border border-mkt-border bg-mkt-surface p-6"
    >
      <Icon className="h-5 w-5 text-mkt-accent" strokeWidth={1.5} />
      <h3 className="mt-3 font-display text-lg font-semibold text-mkt-text">{persona.role}</h3>

      <div className="mt-4 space-y-3 text-sm">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-mkt-text-secondary">Problem</p>
          <p className="mt-1 text-mkt-text-secondary">{persona.problem}</p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-mkt-text-secondary">How it helps</p>
          <p className="mt-1 text-mkt-text-secondary">{persona.solution}</p>
        </div>
      </div>

      <div className="mt-4 border-t border-mkt-border pt-3">
        <span className="rounded-full border border-mkt-border px-2.5 py-1 text-[11px] text-mkt-text-secondary">
          {persona.feature}
        </span>
      </div>
    </motion.div>
  );
}
