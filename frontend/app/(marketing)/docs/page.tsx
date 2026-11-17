import { Tabs } from "@/components/marketing/Tabs";
import { CodeBlock } from "@/components/marketing/CodeBlock";
import { EndpointRow } from "@/components/marketing/EndpointRow";

const NAV_SECTIONS = [
  { id: "quickstart", label: "Quickstart" },
  { id: "environment", label: "Environment variables" },
  { id: "api-reference", label: "API reference" },
  { id: "data-schema", label: "Candidate data schema" },
  { id: "deployment", label: "Deployment" },
];

const ENV_VARS = [
  { name: "EMBEDDING_MODEL_NAME", description: "SentenceTransformers model used for embeddings.", default: "BAAI/bge-small-en-v1.5" },
  { name: "TOP_K_DENSE", description: "Candidates retrieved by the dense FAISS search.", default: "5000" },
  { name: "TOP_K_PRE_RANK", description: "Candidates kept after metadata pre-ranking.", default: "1000" },
  { name: "TOP_K_FINAL", description: "Final ranked list size.", default: "100" },
  { name: "WEIGHT_SEMANTIC / WEIGHT_SKILL / ...", description: "The 8 hybrid-scoring factor weights.", default: "see Scoring page" },
  { name: "SUPABASE_URL", description: "Your Supabase project URL.", default: "—" },
  { name: "SUPABASE_ANON_KEY", description: "Supabase anon/publishable key.", default: "—" },
  { name: "NEXT_PUBLIC_API_BASE_URL", description: "Backend API base URL, for the frontend.", default: "http://127.0.0.1:8000" },
];

const ENDPOINTS: { method: "GET" | "POST"; path: string; description: string }[] = [
  { method: "POST", path: "/jobs", description: "Create a job from pasted description text" },
  { method: "POST", path: "/jobs/upload", description: "Create a job from an uploaded PDF/DOCX" },
  { method: "GET", path: "/jobs", description: "List your jobs" },
  { method: "GET", path: "/jobs/{id}", description: "Fetch a single job" },
  { method: "GET", path: "/jobs/{id}/results", description: "Resumes scored against this job" },
  { method: "GET", path: "/jobs/{id}/existing-matches", description: "Existing pool candidates ranked against this job" },
  { method: "POST", path: "/resumes/upload", description: "Upload and score a resume" },
  { method: "GET", path: "/resumes/{id}", description: "Fetch a parsed/scored resume" },
  { method: "POST", path: "/rank", description: "Admin: rebuild the full 100K index" },
];

const SCHEMA_FIELDS = [
  { field: "candidate_id", description: "Unique identifier, e.g. CAND_0000001" },
  { field: "profile", description: "Headline, summary, years of experience, location" },
  { field: "career_history", description: "Past roles — company, title, dates, description" },
  { field: "education", description: "Institution, degree, field of study, tier" },
  { field: "skills", description: "Name, proficiency, endorsements" },
  { field: "certifications", description: "Name, issuer, year" },
  { field: "languages", description: "Language and proficiency level" },
  { field: "redrob_signals", description: "Behavioral/platform engagement signals" },
];

export default function DocsPage() {
  return (
    <div className="mx-auto max-w-[1280px] px-6 py-12 lg:px-8">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[200px_1fr]">
        {/* Sticky left nav */}
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <p className="text-xs font-semibold uppercase tracking-wide text-mkt-text-secondary">On this page</p>
            <nav className="mt-3 flex flex-col gap-2.5">
              {NAV_SECTIONS.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="text-sm text-mkt-text-secondary transition hover:text-mkt-text"
                >
                  {s.label}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        {/* Content */}
        <div className="space-y-20">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-mkt-text-secondary">Docs</p>
            <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-mkt-text">
              Get started
            </h1>
            <p className="mt-3 max-w-xl text-mkt-text-secondary">
              Three services, run locally in three terminals. No cloud account
              required to try the ranking engine itself.
            </p>
          </div>

          <section id="quickstart" className="scroll-mt-24">
            <h2 className="font-display text-2xl font-semibold text-mkt-text">Quickstart</h2>
            <p className="mt-2 text-sm text-mkt-text-secondary">
              Run each of these in its own terminal, in order.
            </p>
            <div className="mt-6">
              <Tabs
                items={[
                  {
                    label: "AI Engine",
                    content: (
                      <CodeBlock
                        label="Terminal"
                        code={"cd ai_engine\npip install -r requirements.txt\npython scripts/inference.py"}
                      />
                    ),
                  },
                  {
                    label: "Backend",
                    content: (
                      <CodeBlock
                        label="Terminal"
                        code={"cd backend\npip install -r requirements.txt\nuvicorn app.main:app --reload --port 8000"}
                      />
                    ),
                  },
                  {
                    label: "Frontend",
                    content: (
                      <CodeBlock label="Terminal" code={"cd frontend\nnpm install\nnpm run dev"} />
                    ),
                  },
                ]}
              />
            </div>
          </section>

          <section id="environment" className="scroll-mt-24">
            <h2 className="font-display text-2xl font-semibold text-mkt-text">Environment variables</h2>
            <div className="mt-6 overflow-x-auto rounded-xl border border-mkt-border">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-mkt-border bg-mkt-surface">
                  <tr>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-mkt-text-secondary">Variable</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-mkt-text-secondary">Description</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-mkt-text-secondary">Default</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-mkt-border">
                  {ENV_VARS.map((v) => (
                    <tr key={v.name}>
                      <td className="px-4 py-3 font-mono text-xs text-mkt-text">{v.name}</td>
                      <td className="px-4 py-3 text-xs text-mkt-text-secondary">{v.description}</td>
                      <td className="px-4 py-3 font-mono text-xs text-mkt-text-secondary">{v.default}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section id="api-reference" className="scroll-mt-24">
            <h2 className="font-display text-2xl font-semibold text-mkt-text">API reference</h2>
            <div className="mt-6 rounded-xl border border-mkt-border px-5">
              {ENDPOINTS.map((e) => (
                <EndpointRow key={e.method + e.path} {...e} />
              ))}
            </div>
          </section>

          <section id="data-schema" className="scroll-mt-24">
            <h2 className="font-display text-2xl font-semibold text-mkt-text">Candidate data schema</h2>
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {SCHEMA_FIELDS.map((f) => (
                <div key={f.field} className="rounded-lg border border-mkt-border p-4">
                  <code className="font-mono text-sm text-mkt-text">{f.field}</code>
                  <p className="mt-1 text-xs text-mkt-text-secondary">{f.description}</p>
                </div>
              ))}
            </div>
          </section>

          <section id="deployment" className="scroll-mt-24">
            <h2 className="font-display text-2xl font-semibold text-mkt-text">Deployment</h2>
            <p className="mt-3 text-sm text-mkt-text-secondary">
              A Docker Compose setup is included in <code className="font-mono">infra/</code>,
              wrapping all three services behind Nginx for self-hosting.
            </p>
            <div className="mt-6">
              <CodeBlock label="infra/" code={"docker compose up --build"} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
