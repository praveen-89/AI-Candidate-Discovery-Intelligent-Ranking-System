"use client";

import { useState } from "react";
import { Brain, Loader2, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export default function LandingPage() {
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleSignIn = async () => {
    setSigningIn(true);
    setError("");
    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (signInError) {
        setError(signInError.message);
        setSigningIn(false);
      }
      // On success, the browser is redirected to Google — nothing else to do here.
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start sign-in.");
      setSigningIn(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5 lg:px-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-violet-600">
              <Brain className="h-4 w-4 text-white" />
            </div>
            <p className="text-sm font-semibold tracking-tight">AI Talent Intelligence</p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={handleGoogleSignIn}
              disabled={signingIn}
              className="rounded-md border border-border px-4 py-1.5 text-sm font-medium text-muted-foreground transition hover:border-muted-foreground hover:text-foreground disabled:opacity-60"
            >
              Sign in
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-6 py-20 lg:px-8 lg:py-28">
          <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
            {/* Left: copy */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-accent-fg">
                Talent Intelligence Platform
              </p>

              <h1 className="mt-4 text-4xl font-semibold leading-[1.1] tracking-tight text-foreground lg:text-5xl">
                Screen candidates on fit, not just keywords.
              </h1>

              <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground">
                Post a role, and every resume — uploaded today or already in your
                pipeline — gets ranked against it on skills, experience,
                education, and semantic fit. Every score comes with the
                reasoning behind it.
              </p>

              <div className="mt-9 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                <button
                  onClick={handleGoogleSignIn}
                  disabled={signingIn}
                  className="flex items-center gap-2.5 rounded-md bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:opacity-60"
                >
                  {signingIn ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <GoogleIcon className="h-4 w-4" />
                  )}
                  {signingIn ? "Redirecting..." : "Sign in with Google"}
                </button>
                <span className="text-xs text-muted-foreground">No setup required — your workspace is ready instantly.</span>
              </div>

              {error && <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>}
            </div>

            {/* Right: a plain, data-forward panel instead of a screenshot/illustration */}
            <div className="rounded-lg border border-border bg-input">
              <div className="flex items-center justify-between border-b border-border px-5 py-3">
                <p className="text-xs font-medium text-muted-foreground">Senior ML Engineer</p>
                <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                  Scored
                </span>
              </div>
              <div className="divide-y divide-border">
                {[
                  { label: "Semantic fit", value: 87 },
                  { label: "Skill match", value: 92 },
                  { label: "Experience", value: 78 },
                  { label: "Education", value: 65 },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between px-5 py-3.5">
                    <span className="text-sm text-muted-foreground">{row.label}</span>
                    <div className="flex items-center gap-3">
                      <div className="h-1.5 w-28 overflow-hidden rounded-full bg-surface">
                        <div
                          className="h-full rounded-full bg-violet-500"
                          style={{ width: `${row.value}%` }}
                        />
                      </div>
                      <span className="w-9 text-right text-sm font-medium text-muted-foreground">{row.value}%</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-border px-5 py-3">
                <p className="text-xs text-muted-foreground">
                  Matched against 8 weighted dimensions, including behavioral signals and location fit.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How it works — plain numbered steps instead of an icon grid */}
        <section className="border-t border-border">
          <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
            <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">
              <Step
                number="01"
                title="Define the role"
                description="Paste a job description, or upload the file — requirements and skills are extracted automatically."
              />
              <Step
                number="02"
                title="Bring in candidates"
                description="Upload resumes directly, or search the ones you already have on file. PDF, DOCX, or plain text."
              />
              <Step
                number="03"
                title="Review ranked results"
                description="See every candidate ranked and scored, with the specific reasons behind each score."
              />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 text-xs text-muted-foreground lg:px-8">
          <span>AI Talent Intelligence Platform</span>
          <span className="flex items-center gap-1">
            Sign in to get started <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </footer>
    </div>
  );
}

function Step({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="border-t border-border pt-5">
      <p className="text-xs font-mono text-muted-foreground">{number}</p>
      <h3 className="mt-2 text-sm font-semibold text-muted-foreground">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{description}</p>
    </div>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  );
}
