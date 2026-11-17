"use client";

import { motion } from "framer-motion";
import { ScoreBar } from "@/components/marketing/ScoreBar";
import { WeightExplorer } from "@/components/marketing/WeightExplorer";
import { ExplanationCard, SAMPLE_EXPLANATIONS } from "@/components/marketing/ExplanationCard";
import { CTABand } from "@/components/marketing/CTABand";
import { SCORE_FACTORS } from "@/lib/marketing/factors";

const ANNOTATIONS = [
  { label: "Final score", detail: "The weighted sum of all 8 factors, 0–1." },
  { label: "Score Bar", detail: "Each factor's share of the final score, visually." },
  { label: "Matched skills", detail: "Required skills found in the candidate's profile." },
  { label: "Missing skills", detail: "Required skills not found — shown, not hidden." },
  { label: "Plain-language reasons", detail: "The specific, human-readable 'why' behind the score." },
];

export default function ScoringPage() {
  return (
    <>
      <section className="mkt-dot-grid border-b border-mkt-border">
        <div className="mx-auto max-w-[1280px] px-6 py-20 text-center lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-mkt-text-secondary">
            Scoring & Explainability
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-mkt-text sm:text-5xl">
            Eight factors. One transparent score.
          </h1>
          <div className="mx-auto mt-10 max-w-2xl">
            <ScoreBar height="lg" showLabels />
          </div>
        </div>
      </section>

      <section className="border-b border-mkt-border bg-mkt-surface">
        <div className="mx-auto max-w-[1280px] px-6 py-20 lg:px-8">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-mkt-text">
            Try the weights yourself
          </h2>
          <p className="mt-3 max-w-xl text-mkt-text-secondary">
            Defaults match the real model. Drag any slider — the sample
            candidate's score and contribution breakdown update live.
          </p>
          <div className="mt-10">
            <WeightExplorer />
          </div>
        </div>
      </section>

      <section className="border-b border-mkt-border">
        <div className="mx-auto max-w-[1280px] px-6 py-20 lg:px-8">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-mkt-text">
            What each factor measures
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SCORE_FACTORS.map((f, i) => (
              <motion.div
                key={f.key}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.04 }}
                className="rounded-xl border border-mkt-border p-5"
              >
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: f.color }} />
                  <h3 className="text-sm font-semibold text-mkt-text">{f.label}</h3>
                  <span className="ml-auto font-mono text-xs text-mkt-text-secondary">
                    {Math.round(f.weight * 100)}%
                  </span>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-mkt-text-secondary">{f.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-mkt-border bg-mkt-surface">
        <div className="mx-auto max-w-[1280px] px-6 py-20 lg:px-8">
          <h2 className="text-center font-display text-3xl font-semibold tracking-tight text-mkt-text">
            Anatomy of an explanation
          </h2>
          <div className="mx-auto mt-12 grid max-w-4xl grid-cols-1 gap-10 lg:grid-cols-2">
            <ExplanationCard data={SAMPLE_EXPLANATIONS[0]} />
            <ul className="space-y-5">
              {ANNOTATIONS.map((a, i) => (
                <motion.li
                  key={a.label}
                  initial={{ opacity: 0, x: 12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  className="border-l-2 border-mkt-accent pl-4"
                >
                  <p className="text-sm font-semibold text-mkt-text">{a.label}</p>
                  <p className="mt-0.5 text-sm text-mkt-text-secondary">{a.detail}</p>
                </motion.li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="border-b border-mkt-border">
        <div className="mx-auto max-w-2xl px-6 py-16 text-center lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-mkt-text-secondary">A fairness note</p>
          <p className="mt-3 text-mkt-text-secondary leading-relaxed">
            Parsed resumes receive neutral defaults for signals they structurally
            can&apos;t contain — like platform engagement history. They&apos;re
            scored on skill, semantic, education, and career merit, never
            artificially boosted or penalized for data they were never going to have.
          </p>
        </div>
      </section>

      <CTABand />
    </>
  );
}
