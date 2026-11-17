"use client";

import { motion } from "framer-motion";
import { PipelineStepper, type PipelineStep } from "@/components/marketing/PipelineStepper";
import { FunnelViz } from "@/components/marketing/FunnelViz";
import { CTABand } from "@/components/marketing/CTABand";

const STEPS: PipelineStep[] = [
  {
    number: "01",
    title: "Parse",
    input: "A job description (text/PDF/DOCX) or a resume (PDF/DOCX/TXT).",
    process: "Extracts raw text, detects sections, and pulls out skills, titles, dates, and education.",
    output: "A structured record matching the candidate/job schema.",
    snippet: `{ "skills": ["python", "pytorch"], "years_of_experience": 6.0 }`,
  },
  {
    number: "02",
    title: "Extract features",
    input: "The structured record.",
    process: "Computes numeric/boolean signals: career span, education tier, location tier, behavioral score.",
    output: "A flat feature dictionary ready for scoring.",
    snippet: `{ "career_span_years": 6.9, "education_tier_score": 0.75 }`,
  },
  {
    number: "03",
    title: "Embed",
    input: "A rich text representation of the profile.",
    process: "BAAI/bge-small-en-v1.5, via SentenceTransformers, running on CPU.",
    output: "A 384-dimension, L2-normalized embedding vector.",
  },
  {
    number: "04",
    title: "Retrieve",
    input: "The job's embedding.",
    process: "FAISS dense search over the live index of all candidate vectors.",
    output: "The top-K most semantically similar candidates, by cosine similarity.",
    snippet: "retriever.search(job_embedding, top_k=5000)",
  },
  {
    number: "05",
    title: "Rank",
    input: "Candidate features + semantic scores + the job's requirements.",
    process: "The 8-factor hybrid scorer blends every signal into one final score.",
    output: "A ranked list with a final score and per-factor sub-scores.",
  },
  {
    number: "06",
    title: "Explain",
    input: "The ranked result + raw features.",
    process: "Computes each factor's % contribution and generates plain-language reasons.",
    output: `{ "why_candidate_matches": ["Strong match for required skills: python, fastapi."] }`,
  },
  {
    number: "07",
    title: "Review",
    input: "The final, explained ranking.",
    process: "Rendered in the recruiter dashboard — sortable, filterable, drillable.",
    output: "A decision, made with the reasoning in hand.",
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <section className="mkt-dot-grid border-b border-mkt-border">
        <div className="mx-auto max-w-[1280px] px-6 py-20 text-center lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-mkt-text-secondary">How it works</p>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-mkt-text sm:text-5xl">
            Parse → Extract → Embed → Retrieve → Rank → Explain → Review
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-mkt-text-secondary">
            The same seven-step pipeline runs for both a 100,000-candidate batch
            job and a single real-time resume upload.
          </p>
        </div>
      </section>

      <section className="border-b border-mkt-border">
        <div className="mx-auto max-w-[1280px] px-6 py-16 lg:px-8">
          <PipelineStepper steps={STEPS} />
        </div>
      </section>

      {/* Two flows side by side */}
      <section className="border-b border-mkt-border bg-mkt-surface">
        <div className="mx-auto max-w-[1280px] px-6 py-20 lg:px-8">
          <h2 className="text-center font-display text-3xl font-semibold tracking-tight text-mkt-text">
            One pipeline, two speeds
          </h2>
          <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <FlowCard
              title="Batch: the 100K pool"
              timing="~36 seconds"
              points={[
                "Streams and embeds the full candidate pool once, cached after that.",
                "Runs the entire pipeline against one job at a time.",
                "CPU-only, within 16 GB of RAM.",
              ]}
            />
            <FlowCard
              title="Real-time: a single resume"
              timing="~1 second"
              points={[
                "Parses and embeds just the one uploaded resume.",
                "Scored against the job and added to the live index immediately.",
                "No batch job, no waiting on the other 100,000 candidates.",
              ]}
            />
          </div>
        </div>
      </section>

      <section className="border-b border-mkt-border">
        <div className="mx-auto max-w-[1280px] px-6 py-20 lg:px-8">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-mkt-text">
            The retrieval funnel, end to end
          </h2>
          <div className="mt-10 rounded-xl border border-mkt-border bg-mkt-surface p-6 lg:p-10">
            <FunnelViz />
          </div>
        </div>
      </section>

      <CTABand />
    </>
  );
}

function FlowCard({ title, timing, points }: { title: string; timing: string; points: string[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="rounded-xl border border-mkt-border bg-mkt-bg p-6"
    >
      <div className="flex items-baseline justify-between">
        <h3 className="font-display text-lg font-semibold text-mkt-text">{title}</h3>
        <span className="font-mono text-sm text-mkt-accent">{timing}</span>
      </div>
      <ul className="mt-4 space-y-2.5">
        {points.map((p) => (
          <li key={p} className="flex gap-2.5 text-sm text-mkt-text-secondary">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-mkt-accent" />
            {p}
          </li>
        ))}
      </ul>
    </motion.div>
  );
}
