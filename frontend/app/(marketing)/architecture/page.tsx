import { Lock, Cpu, Server, Boxes } from "lucide-react";
import { ArchitectureDiagram } from "@/components/marketing/ArchitectureDiagram";
import { CTABand } from "@/components/marketing/CTABand";

const MODULES = [
  { name: "ai_engine", role: "Ranking engine: parsing, embeddings, FAISS retrieval, hybrid scoring." },
  { name: "backend", role: "FastAPI REST API, warm in-process AI runtime, auth verification." },
  { name: "frontend", role: "Next.js 16 App Router dashboard and this marketing site." },
  { name: "supabase", role: "Postgres schema, Auth, Storage buckets, Row Level Security policies." },
  { name: "shared", role: "Types and schemas shared across backend and frontend." },
  { name: "infra", role: "Docker Compose and Nginx configuration for deployment." },
  { name: "datasets", role: "Raw and processed candidate data, FAISS index, features cache." },
  { name: "uploads", role: "Local scratch space for resume/job files before Supabase Storage." },
];

const TECH_STACK = [
  { layer: "AI Engine", items: "Python 3.11, FAISS, SentenceTransformers (BAAI/bge-small-en-v1.5)" },
  { layer: "Backend", items: "FastAPI, Uvicorn, Pydantic, Supabase Python client" },
  { layer: "Frontend", items: "Next.js 16, React 19, Tailwind CSS v4, Recharts" },
  { layer: "Data", items: "Supabase (Postgres, Auth, Storage)" },
  { layer: "Infra", items: "Docker Compose, Nginx" },
];

export default function ArchitecturePage() {
  return (
    <>
      <section className="mkt-dot-grid border-b border-mkt-border">
        <div className="mx-auto max-w-[1280px] px-6 py-20 text-center lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-mkt-text-secondary">
            Architecture & Tech
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-mkt-text sm:text-5xl">
            A monorepo built to stay decoupled.
          </h1>
        </div>
      </section>

      <section className="border-b border-mkt-border">
        <div className="mx-auto max-w-[1280px] px-6 py-16 lg:px-8">
          <ArchitectureDiagram />
        </div>
      </section>

      <section className="border-b border-mkt-border bg-mkt-surface">
        <div className="mx-auto max-w-[1280px] px-6 py-20 lg:px-8">
          <div className="flex items-center gap-2">
            <Boxes className="h-5 w-5 text-mkt-accent" strokeWidth={1.5} />
            <h2 className="font-display text-2xl font-semibold tracking-tight text-mkt-text">Monorepo modules</h2>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {MODULES.map((m) => (
              <div key={m.name} className="rounded-lg border border-mkt-border bg-mkt-bg p-4">
                <p className="font-mono text-sm font-semibold text-mkt-text">{m.name}/</p>
                <p className="mt-1.5 text-xs leading-relaxed text-mkt-text-secondary">{m.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-mkt-border">
        <div className="mx-auto max-w-[1280px] px-6 py-20 lg:px-8">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-mkt-text">Tech stack by layer</h2>
          <div className="mt-8 overflow-x-auto rounded-xl border border-mkt-border">
            <table className="w-full text-left text-sm">
              <tbody className="divide-y divide-mkt-border">
                {TECH_STACK.map((row) => (
                  <tr key={row.layer}>
                    <td className="w-40 px-5 py-3.5 font-medium text-mkt-text">{row.layer}</td>
                    <td className="px-5 py-3.5 font-mono text-xs text-mkt-text-secondary">{row.items}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="border-b border-mkt-border bg-mkt-surface">
        <div className="mx-auto max-w-[1280px] px-6 py-20 lg:px-8">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
            <div>
              <div className="flex items-center gap-2">
                <Cpu className="h-5 w-5 text-mkt-accent" strokeWidth={1.5} />
                <h2 className="font-display text-xl font-semibold text-mkt-text">Performance</h2>
              </div>
              <ul className="mt-5 space-y-3 text-sm text-mkt-text-secondary">
                <li>100,000 candidates ranked in ~36 seconds, with the embedding cache.</li>
                <li>CPU-only, within 16 GB of RAM — no GPU required.</li>
                <li>~1 second for a single real-time resume upload.</li>
                <li>Incremental indexing — no full rebuild for new resumes.</li>
              </ul>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-mkt-accent" strokeWidth={1.5} />
                <h2 className="font-display text-xl font-semibold text-mkt-text">Security</h2>
              </div>
              <ul className="mt-5 space-y-3 text-sm text-mkt-text-secondary">
                <li>Google OAuth via Supabase Auth.</li>
                <li>Every request carries a per-user bearer token, verified server-side.</li>
                <li>Row Level Security on every table — Postgres enforces it, not just the app.</li>
                <li>No service-role key is used for data access — only for auth verification.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <div className="border-b border-mkt-border py-10 text-center">
        <Server className="mx-auto h-5 w-5 text-mkt-text-secondary" strokeWidth={1.5} />
        <p className="mt-2 text-sm text-mkt-text-secondary">Self-hostable with the included Docker Compose setup.</p>
      </div>

      <CTABand />
    </>
  );
}
