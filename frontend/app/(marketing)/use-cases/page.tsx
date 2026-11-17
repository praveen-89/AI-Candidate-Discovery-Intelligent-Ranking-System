"use client";

import { UserRound, Briefcase, Building2, Users } from "lucide-react";
import { PersonaCard, type Persona } from "@/components/marketing/PersonaCard";
import { CTABand } from "@/components/marketing/CTABand";

const PERSONAS: Persona[] = [
  {
    icon: UserRound,
    role: "In-house recruiter",
    problem: "Dozens of resumes land for every open role, and keyword filters reject strong candidates who simply phrase their experience differently.",
    solution: "Post the role once — every resume gets ranked on semantic fit and 8 weighted factors, with the reasoning for every score.",
    feature: "Real-time resume scoring",
  },
  {
    icon: Briefcase,
    role: "Talent acquisition lead",
    problem: "Needs to know, across every open requisition, who in the existing candidate pool is actually a fit — without re-screening manually.",
    solution: "Search the existing 100,000-candidate pool against any job in seconds, ranked and explained, no new sourcing required.",
    feature: "Batch candidate discovery",
  },
  {
    icon: Building2,
    role: "Staffing agency",
    problem: "Manages many client roles at once and needs to justify every shortlist with more than a gut feeling.",
    solution: "Every candidate sent to a client comes with a transparent score breakdown and matched/missing skills, not just a name.",
    feature: "Explainable results",
  },
  {
    icon: Users,
    role: "Hiring manager",
    problem: "Wants to understand why a shortlist looks the way it does before sitting down with a recruiter.",
    solution: "Reviews the same ranked, explained list the recruiter sees — plain-language reasons, not a black-box score.",
    feature: "Recruiter dashboard",
  },
];

export default function UseCasesPage() {
  return (
    <>
      <section className="mkt-dot-grid border-b border-mkt-border">
        <div className="mx-auto max-w-[1280px] px-6 py-20 text-center lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-mkt-text-secondary">Use Cases</p>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-mkt-text sm:text-5xl">
            Built for how hiring teams actually work.
          </h1>
        </div>
      </section>

      <section className="border-b border-mkt-border">
        <div className="mx-auto max-w-[1280px] px-6 py-20 lg:px-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {PERSONAS.map((p, i) => (
              <PersonaCard key={p.role} persona={p} delay={i * 0.08} />
            ))}
          </div>
        </div>
      </section>

      <CTABand />
    </>
  );
}
