"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface FeatureRowProps {
  eyebrow: string;
  title: string;
  description: string;
  bullets?: string[];
  visual: ReactNode;
  reverse?: boolean;
}

/** A zig-zag feature section: copy on one side, a UI mock on the other, alternating. */
export function FeatureRow({ eyebrow, title, description, bullets, visual, reverse }: FeatureRowProps) {
  return (
    <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-10%" }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={cn(reverse && "lg:order-2")}
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-mkt-accent">{eyebrow}</p>
        <h3 className="mt-3 font-display text-2xl font-semibold tracking-tight text-mkt-text sm:text-3xl">
          {title}
        </h3>
        <p className="mt-4 text-mkt-text-secondary leading-relaxed">{description}</p>
        {bullets && bullets.length > 0 && (
          <ul className="mt-5 space-y-2.5">
            {bullets.map((b) => (
              <li key={b} className="flex gap-2.5 text-sm text-mkt-text-secondary">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-mkt-accent" />
                {b}
              </li>
            ))}
          </ul>
        )}
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-10%" }}
        transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
        className={cn(reverse && "lg:order-1")}
      >
        {visual}
      </motion.div>
    </div>
  );
}
