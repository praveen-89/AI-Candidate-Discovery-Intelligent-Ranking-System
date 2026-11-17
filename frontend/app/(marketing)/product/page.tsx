"use client";

import { motion } from "framer-motion";
import { UploadCloud, FileText, Type, CheckCircle2, RefreshCw, ShieldCheck, LayoutDashboard } from "lucide-react";
import { FeatureRow } from "@/components/marketing/FeatureRow";
import { BrowserFrame } from "@/components/marketing/BrowserFrame";
import { ExplanationCard, SAMPLE_EXPLANATIONS } from "@/components/marketing/ExplanationCard";
import { ScoreBar } from "@/components/marketing/ScoreBar";
import { CTABand } from "@/components/marketing/CTABand";

const RECAP_TILES = [
  { icon: LayoutDashboard, title: "Batch discovery", description: "Rank 100K candidates in ~36s." },
  { icon: UploadCloud, title: "Real-time scoring", description: "One resume, scored in ~1s." },
  { icon: Type, title: "Job management", description: "Paste text or upload a file." },
  { icon: CheckCircle2, title: "Explainability", description: "Factor %, skills, plain reasons." },
  { icon: FileText, title: "Skills taxonomy", description: "133 skills from real data." },
  { icon: RefreshCw, title: "Incremental indexing", description: "No rebuild on new resumes." },
  { icon: ShieldCheck, title: "Secure access", description: "Google sign-in + RLS." },
  { icon: LayoutDashboard, title: "Recruiter dashboard", description: "5 screens, one engine." },
];

export default function ProductPage() {
  return (
    <>
      <section className="mkt-dot-grid border-b border-mkt-border">
        <div className="mx-auto max-w-[1280px] px-6 py-20 text-center lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-mkt-text-secondary">Product</p>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-mkt-text sm:text-5xl">
            Everything a recruiter needs, nothing it doesn&apos;t.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-mkt-text-secondary">
            Seven capabilities, one ranking engine — from the first job you post
            to the hundredth resume you compare.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-[1280px] space-y-24 px-6 py-24 lg:px-8">
        <FeatureRow
          eyebrow="Batch discovery"
          title="Rank the entire pool against a job"
          description="Point the engine at a job description and it searches, filters, and ranks the full 100,000-candidate pool in about 36 seconds — with an embedding cache, on CPU-only infrastructure, within 16 GB of RAM."
          bullets={[
            "Dense FAISS retrieval narrows 100,000 to 5,000",
            "Metadata pre-ranking narrows 5,000 to 1,000",
            "Hybrid 8-factor scoring produces the final Top 100",
          ]}
          visual={
            <BrowserFrame url="app.aitalentintelligence.com/ranking">
              <div className="space-y-3">
                {SAMPLE_EXPLANATIONS.slice(0, 2).map((d) => (
                  <ExplanationCard key={d.candidateId} data={d} />
                ))}
              </div>
            </BrowserFrame>
          }
        />

        <FeatureRow
          reverse
          eyebrow="Real-time resume upload"
          title="Score one resume while you wait"
          description="Drop in a PDF, DOCX, or TXT resume. It's parsed into a structured profile, embedded, scored against your job, explained, and added to the live index — in about a second."
          bullets={[
            "No batch job, no waiting — scored in real time",
            "Added to the FAISS index immediately, no rebuild",
            "Parsed resumes get neutral defaults for signals they can't contain",
          ]}
          visual={
            <BrowserFrame url="app.aitalentintelligence.com/jobs/senior-ml-engineer">
              <UploadMock />
            </BrowserFrame>
          }
        />

        <FeatureRow
          eyebrow="Job management"
          title="Define a role in seconds"
          description="Paste the job description text, or upload the file directly — PDF or DOCX. Either way, it's parsed into structured requirements: skills, years of experience, and a semantic search query."
          bullets={[
            "Matched against a 133-skill vocabulary drawn from real candidate data",
            "Every job becomes a reusable target for both batch and real-time scoring",
          ]}
          visual={<JobCreateMock />}
        />

        <FeatureRow
          reverse
          eyebrow="Explainability"
          title="Never a black-box score"
          description="Every result ships with the percentage each of the 8 factors contributed, which required skills matched and which didn't, and plain-language reasons a recruiter can act on."
          visual={<ExplanationCard data={SAMPLE_EXPLANATIONS[0]} />}
        />

        <FeatureRow
          eyebrow="Incremental indexing"
          title="The index never needs a rebuild"
          description="New resumes are added to the live FAISS index the moment they're scored. The next search — batch or real-time — sees them immediately, without reprocessing the other 100,000 candidates."
          visual={
            <div className="rounded-xl border border-mkt-border bg-mkt-surface p-6">
              <ScoreBar height="lg" showLabels />
            </div>
          }
        />

        <FeatureRow
          reverse
          eyebrow="Secure access"
          title="Google sign-in, Row Level Security everywhere"
          description="Every job and resume belongs to the signed-in user. The backend queries Postgres as that user — not with an admin key — so Row Level Security is the real enforcement on every request, not just a formality."
          visual={<SecurityMock />}
        />

        <FeatureRow
          eyebrow="Recruiter dashboard"
          title="Dashboard, Candidates, Ranking, Jobs, System"
          description="Five screens backed by the same live ranking engine — browse ranked candidates, drill into any result, manage jobs, upload resumes, and check system status, all in one place."
          visual={
            <BrowserFrame url="app.aitalentintelligence.com/dashboard">
              <div className="grid grid-cols-3 gap-2 text-center">
                {["Dashboard", "Candidates", "Ranking", "Jobs", "System"].map((s) => (
                  <div key={s} className="rounded-md border border-mkt-border py-3 text-xs text-mkt-text-secondary">
                    {s}
                  </div>
                ))}
              </div>
            </BrowserFrame>
          }
        />
      </div>

      <section className="border-t border-mkt-border bg-mkt-surface">
        <div className="mx-auto max-w-[1280px] px-6 py-20 lg:px-8">
          <h2 className="text-center font-display text-3xl font-semibold tracking-tight text-mkt-text">
            All eight, at a glance
          </h2>
          <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {RECAP_TILES.map((tile, i) => (
              <motion.div
                key={tile.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.04 }}
                className="rounded-xl border border-mkt-border p-5"
              >
                <tile.icon className="h-5 w-5 text-mkt-accent" strokeWidth={1.5} />
                <h3 className="mt-3 text-sm font-semibold text-mkt-text">{tile.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-mkt-text-secondary">{tile.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <CTABand />
    </>
  );
}

function UploadMock() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-mkt-border px-4 py-10 text-center">
      <UploadCloud className="h-6 w-6 text-mkt-text-secondary" />
      <p className="text-sm text-mkt-text-secondary">resume.pdf — parsed, embedded, scored</p>
      <div className="mt-2 h-1.5 w-40 overflow-hidden rounded-full bg-mkt-border">
        <div className="h-full w-full rounded-full bg-mkt-accent" />
      </div>
      <p className="text-xs text-mkt-text-secondary">Done in ~1s</p>
    </div>
  );
}

function JobCreateMock() {
  return (
    <BrowserFrame url="app.aitalentintelligence.com/jobs">
      <div className="inline-flex rounded-md border border-mkt-border p-0.5 text-xs">
        <span className="rounded bg-mkt-accent px-3 py-1 font-medium text-mkt-accent-ink">Paste text</span>
        <span className="rounded px-3 py-1 text-mkt-text-secondary">Upload file</span>
      </div>
      <p className="mt-4 rounded-md border border-mkt-border bg-mkt-bg p-3 text-xs leading-relaxed text-mkt-text-secondary">
        Senior ML Engineer — 5+ years, Python, PyTorch, NLP, RAG, FAISS...
      </p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {["Python", "PyTorch", "RAG", "FAISS", "5+ yrs"].map((s) => (
          <span key={s} className="rounded-full border border-mkt-border px-2 py-0.5 text-[11px] text-mkt-text">
            {s}
          </span>
        ))}
      </div>
    </BrowserFrame>
  );
}

function SecurityMock() {
  return (
    <BrowserFrame url="supabase.com/dashboard">
      <div className="space-y-2 font-mono text-xs">
        <p className="text-mkt-text-secondary">
          <span className="text-mkt-accent">POLICY</span> jobs_select_own
        </p>
        <p className="rounded-md border border-mkt-border bg-mkt-bg p-2.5 text-mkt-text">
          FOR SELECT USING (auth.uid() = owner_user_id)
        </p>
        <p className="mt-3 text-mkt-text-secondary">
          <span className="text-mkt-accent">REQUEST</span> Authorization: Bearer &lt;token&gt;
        </p>
      </div>
    </BrowserFrame>
  );
}
