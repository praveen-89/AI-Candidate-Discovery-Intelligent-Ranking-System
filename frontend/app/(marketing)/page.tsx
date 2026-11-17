"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Search, Sparkles, MessageSquareQuote } from "lucide-react";
import { GithubIcon } from "@/components/marketing/icons/GithubIcon";
import { Button } from "@/components/marketing/Button";
import { ScoreBar } from "@/components/marketing/ScoreBar";
import { FunnelViz } from "@/components/marketing/FunnelViz";
import { ExplanationCard, SAMPLE_EXPLANATIONS } from "@/components/marketing/ExplanationCard";
import { StatCounter } from "@/components/marketing/StatCounter";
import { BrowserFrame } from "@/components/marketing/BrowserFrame";
import { CTABand } from "@/components/marketing/CTABand";
import { SCORE_FACTORS } from "@/lib/marketing/factors";

const GITHUB_URL = "https://github.com/praveen-89/AI-Candidate-Discovery-Intelligent-Ranking-System";

const STATS = [
  { value: 100000, suffix: "+", label: "candidate profiles" },
  { value: 36, prefix: "~", suffix: "s", label: "full-pool ranking" },
  { value: 1, prefix: "~", suffix: "s", label: "per resume, real-time" },
  { value: 8, label: "ranking factors" },
  { value: 133, label: "skill taxonomy" },
  { value: 0, label: "runs on", display: "CPU-only" },
];

const PILLARS = [
  {
    icon: Search,
    title: "Discover",
    description:
      "Rank the full 100,000-candidate pool against a job description in ~36 seconds, with an embedding cache, on CPU-only infrastructure.",
  },
  {
    icon: Sparkles,
    title: "Score",
    description:
      "Upload a PDF, DOCX, or TXT resume. It's parsed, embedded, scored, and added to the live FAISS index in about a second.",
  },
  {
    icon: MessageSquareQuote,
    title: "Explain",
    description:
      "Every score ships with its factor breakdown, matched vs. missing skills, and plain-language reasons — never a black box.",
  },
];

const PIPELINE_STEPS = [
  { number: "01", title: "Define the role", description: "Paste a job description or upload the file." },
  { number: "02", title: "Bring in candidates", description: "Upload resumes, or search the existing pool." },
  { number: "03", title: "Rank & explain", description: "Hybrid 8-factor scoring, with reasons for every result." },
  { number: "04", title: "Review & decide", description: "A ranked list, explainable from top to bottom." },
];

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

export default function MarketingHome() {
  return (
    <>
      {/* ───────────────────────── Hero ─────────────────────────
          min-h accounts for the 4rem (h-16) sticky navbar; items-start (not
          centered) keeps the copy anchored near the top instead of floating
          mid-screen. The card stack uses compact cards sized so all 3 fit
          alongside it without scrolling — the funnel lives in its own
          section below. */}
      <section className="mkt-dot-grid relative flex min-h-[calc(100vh-4rem)] items-start border-b border-mkt-border">
        <div className="mx-auto w-full max-w-[1280px] px-6 pb-16 pt-12 lg:px-8 lg:pt-16">
          <div className="grid grid-cols-1 items-start gap-16 lg:grid-cols-2">
            <div>
              <p className="inline-flex items-center gap-1.5 rounded-full border border-mkt-border bg-mkt-surface px-3 py-1 text-xs font-medium text-mkt-text-secondary">
                Open source · self-hostable
              </p>
              <h1 className="mt-5 font-display text-5xl font-semibold leading-[1.05] tracking-[-0.02em] text-mkt-text lg:text-[4.5rem]">
                Find the right
                <br />
                <span className="text-mkt-accent">100 in 100,000.</span>
              </h1>
              <p className="mt-6 max-w-lg text-lg leading-relaxed text-mkt-text-secondary">
                Semantic candidate discovery and explainable ranking. Matches a pool
                of 100,000+ candidate profiles against any job description in
                seconds — and shows you why each candidate ranked where they did.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Button href="/login" icon={<ArrowRight className="h-4 w-4" />}>
                  Get Started
                </Button>
                <Button href={GITHUB_URL} variant="secondary" external icon={<GithubIcon className="h-4 w-4" />}>
                  View on GitHub
                </Button>
              </div>
            </div>

            <div className="relative hidden lg:block">
              <div className="space-y-2.5">
                {SAMPLE_EXPLANATIONS.map((data, i) => (
                  <motion.div
                    key={data.candidateId}
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.15 + i * 0.1, ease: "easeOut" }}
                    style={{ transform: `scale(${1 - i * 0.03})`, transformOrigin: "top right" }}
                  >
                    <ExplanationCard data={data} compact />
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────── The funnel ───────────────────────── */}
      <section className="border-b border-mkt-border">
        <div className="mx-auto max-w-[1280px] px-6 py-16 lg:px-8">
          <Reveal>
            <p className="mb-6 text-xs font-semibold uppercase tracking-wide text-mkt-text-secondary">
              The retrieval funnel
            </p>
            <FunnelViz />
          </Reveal>
        </div>
      </section>

      {/* ───────────────────────── Stat strip ───────────────────────── */}
      <section className="border-b border-mkt-border bg-mkt-surface">
        <div className="mx-auto max-w-[1280px] px-6 py-10 lg:px-8">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-6">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center lg:text-left">
                <p className="font-mono text-2xl font-semibold tabular-nums text-mkt-text lg:text-3xl">
                  {stat.display ?? (
                    <StatCounter value={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
                  )}
                </p>
                <p className="mt-1 text-xs text-mkt-text-secondary">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────────────── Problem → Solution ───────────────────────── */}
      <section className="border-b border-mkt-border">
        <div className="mx-auto max-w-[1280px] px-6 py-20 lg:px-8">
          <Reveal>
            <h2 className="max-w-xl font-display text-3xl font-semibold tracking-tight text-mkt-text sm:text-4xl">
              Keyword filtering misses good candidates. Semantic ranking doesn&apos;t.
            </h2>
          </Reveal>
          <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Reveal delay={0.05}>
              <div className="h-full rounded-xl border border-mkt-border p-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-mkt-text-secondary">
                  Keyword ATS filtering
                </p>
                <ul className="mt-4 space-y-3 text-sm text-mkt-text-secondary">
                  <li>Rejects strong candidates who phrase their experience differently.</li>
                  <li>No sense of skill proximity — "PyTorch" ≠ "deep learning frameworks."</li>
                  <li>A pass/fail gate, with no reasoning behind the result.</li>
                </ul>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="h-full rounded-xl border border-mkt-accent/40 bg-mkt-surface p-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-mkt-accent">
                  Semantic + explainable ranking
                </p>
                <ul className="mt-4 space-y-3 text-sm text-mkt-text">
                  <li>Embeddings capture meaning, not just exact keyword matches.</li>
                  <li>8 weighted factors — skills, experience, career, education, and more.</li>
                  <li>Every score comes with the specific reasons behind it.</li>
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ───────────────────────── 3 pillars ───────────────────────── */}
      <section className="border-b border-mkt-border bg-mkt-surface">
        <div className="mx-auto max-w-[1280px] px-6 py-20 lg:px-8">
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">
            {PILLARS.map((pillar, i) => (
              <Reveal key={pillar.title} delay={i * 0.08}>
                <div className="border-t border-mkt-border pt-5">
                  <pillar.icon className="h-5 w-5 text-mkt-accent" strokeWidth={1.5} />
                  <h3 className="mt-4 font-display text-lg font-semibold text-mkt-text">{pillar.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-mkt-text-secondary">{pillar.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────────────── Mini how it works ───────────────────────── */}
      <section className="border-b border-mkt-border">
        <div className="mx-auto max-w-[1280px] px-6 py-20 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="font-display text-3xl font-semibold tracking-tight text-mkt-text">How it works</h2>
            <Link href="/how-it-works" className="inline-flex items-center gap-1 text-sm text-mkt-accent hover:underline">
              See the full pipeline <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {PIPELINE_STEPS.map((step, i) => (
              <Reveal key={step.number} delay={i * 0.06}>
                <p className="font-mono text-sm text-mkt-text-secondary">{step.number}</p>
                <h3 className="mt-2 text-sm font-semibold text-mkt-text">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-mkt-text-secondary">{step.description}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────────────── Dashboard preview ───────────────────────── */}
      <section className="border-b border-mkt-border bg-mkt-surface">
        <div className="mx-auto max-w-[1280px] px-6 py-20 lg:px-8">
          <Reveal>
            <div className="mx-auto max-w-xl text-center">
              <h2 className="font-display text-3xl font-semibold tracking-tight text-mkt-text sm:text-4xl">
                Every ranking, one screen away.
              </h2>
              <p className="mt-3 text-mkt-text-secondary">
                Dashboard, Candidates, Ranking, Jobs, and System status — all backed
                by the same live ranking engine.
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <BrowserFrame className="mx-auto mt-10 max-w-3xl">
              <div className="space-y-3">
                {SAMPLE_EXPLANATIONS.slice(0, 2).map((data) => (
                  <ExplanationCard key={data.candidateId} data={data} />
                ))}
              </div>
            </BrowserFrame>
          </Reveal>
        </div>
      </section>

      {/* ───────────────────────── Score Bar teaser ───────────────────────── */}
      <section className="border-b border-mkt-border">
        <div className="mx-auto max-w-[1280px] px-6 py-20 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
            <Reveal>
              <p className="text-xs font-semibold uppercase tracking-wide text-mkt-text-secondary">
                The scoring model
              </p>
              <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-mkt-text sm:text-4xl">
                Eight factors. One transparent score.
              </h2>
              <p className="mt-4 max-w-md text-mkt-text-secondary">
                Semantic similarity, skill match, experience, career trajectory,
                behavioral signals, education, availability, and location — every
                weight is configurable.
              </p>
              <Link
                href="/scoring"
                className="mt-6 inline-flex items-center gap-1 text-sm text-mkt-accent hover:underline"
              >
                Explore the weight model <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="rounded-xl border border-mkt-border bg-mkt-surface p-6">
                <ScoreBar height="lg" showLabels />
                <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-mkt-border pt-4 sm:grid-cols-4">
                  {SCORE_FACTORS.slice(0, 4).map((f) => (
                    <div key={f.key} className="text-xs text-mkt-text-secondary">
                      {f.label}
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <CTABand />
    </>
  );
}
