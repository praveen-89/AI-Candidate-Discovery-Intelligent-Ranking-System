import { ArrowRight, ArrowLeftRight } from "lucide-react";

function Box({ title, subtitle, className = "" }: { title: string; subtitle: string; className?: string }) {
  return (
    <div className={`rounded-lg border border-mkt-border bg-mkt-surface px-5 py-4 text-center ${className}`}>
      <p className="text-sm font-semibold text-mkt-text">{title}</p>
      <p className="mt-1 text-xs text-mkt-text-secondary">{subtitle}</p>
    </div>
  );
}

/** A plain box-and-arrow system diagram — no illustration needed. */
export function ArchitectureDiagram() {
  return (
    <div className="rounded-xl border border-mkt-border bg-mkt-bg p-6 lg:p-10">
      <div className="rounded-lg border border-dashed border-mkt-border p-5">
        <p className="mb-4 text-center text-[11px] font-semibold uppercase tracking-wide text-mkt-text-secondary">
          Docker Compose + Nginx
        </p>
        <div className="flex flex-col items-center gap-3 lg:flex-row lg:justify-center">
          <Box title="Next.js frontend" subtitle="App Router, React 19" />
          <ArrowRight className="h-4 w-4 shrink-0 rotate-90 text-mkt-text-secondary lg:rotate-0" />
          <Box title="FastAPI backend" subtitle="Warm in-process AI runtime" />
          <ArrowRight className="h-4 w-4 shrink-0 rotate-90 text-mkt-text-secondary lg:rotate-0" />
          <Box title="ai_engine" subtitle="BGE embeddings + FAISS" />
          <ArrowLeftRight className="h-4 w-4 shrink-0 rotate-90 text-mkt-text-secondary lg:rotate-0" />
          <Box title="Supabase" subtitle="Postgres, Auth, Storage, RLS" />
        </div>
      </div>
    </div>
  );
}
