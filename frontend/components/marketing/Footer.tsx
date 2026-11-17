import Link from "next/link";
import { GithubIcon } from "./icons/GithubIcon";

const GITHUB_URL = "https://github.com/praveen-89/AI-Candidate-Discovery-Intelligent-Ranking-System";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { href: "/product", label: "Features" },
      { href: "/how-it-works", label: "How It Works" },
      { href: "/scoring", label: "Scoring & Explainability" },
      { href: "/use-cases", label: "Use Cases" },
    ],
  },
  {
    title: "Developers",
    links: [
      { href: "/architecture", label: "Architecture" },
      { href: "/docs", label: "Docs & API Reference" },
      { href: GITHUB_URL, label: "GitHub Repository", external: true },
    ],
  },
];

const TECH_BADGES = ["Next.js 16", "FastAPI", "FAISS", "SentenceTransformers", "Supabase", "Tailwind CSS"];

export function Footer() {
  return (
    <footer className="border-t border-mkt-border bg-mkt-bg">
      <div className="mx-auto max-w-[1280px] px-6 py-14 lg:px-8">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-2">
            <p className="font-display text-sm font-semibold text-mkt-text">AI Talent Intelligence</p>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-mkt-text-secondary">
              Semantic candidate discovery and explainable ranking, open source.
            </p>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 text-sm text-mkt-text-secondary transition hover:text-mkt-text"
            >
              <GithubIcon className="h-4 w-4" />
              Open source on GitHub
            </a>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="text-xs font-semibold uppercase tracking-wide text-mkt-text-secondary">{col.title}</p>
              <ul className="mt-3 space-y-2.5">
                {col.links.map((link) =>
                  "external" in link && link.external ? (
                    <li key={link.href}>
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-mkt-text-secondary transition hover:text-mkt-text"
                      >
                        {link.label}
                      </a>
                    </li>
                  ) : (
                    <li key={link.href}>
                      <Link href={link.href} className="text-sm text-mkt-text-secondary transition hover:text-mkt-text">
                        {link.label}
                      </Link>
                    </li>
                  )
                )}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap items-center gap-2 border-t border-mkt-border pt-6">
          {TECH_BADGES.map((tech) => (
            <span key={tech} className="rounded-full border border-mkt-border px-2.5 py-1 text-[11px] text-mkt-text-secondary">
              {tech}
            </span>
          ))}
        </div>

        <div className="mt-8 flex flex-col items-start justify-between gap-2 text-xs text-mkt-text-secondary sm:flex-row sm:items-center">
          <span>© {new Date().getFullYear()} AI Talent Intelligence Platform — open source.</span>
          <span>Built with Next.js, FastAPI, and FAISS.</span>
        </div>
      </div>
    </footer>
  );
}
