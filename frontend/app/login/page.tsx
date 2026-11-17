"use client";

import { useState } from "react";
import { Brain, Loader2 } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export default function LoginPage() {
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
      <header className="flex items-center justify-between px-6 py-5 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-violet-600">
            <Brain className="h-4 w-4 text-white" />
          </div>
          <p className="text-sm font-semibold tracking-tight">AI Talent Intelligence</p>
        </Link>
        <ThemeToggle />
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm rounded-lg border border-border bg-surface p-8 text-center shadow-sm">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-md bg-violet-600">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <h1 className="mt-5 text-xl font-semibold tracking-tight">Sign in to continue</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Use your Google account to access your workspace — jobs, uploads, and
            rankings are tied to your account.
          </p>

          <button
            onClick={handleGoogleSignIn}
            disabled={signingIn}
            className="mt-7 flex w-full items-center justify-center gap-2.5 rounded-md bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:opacity-60"
          >
            {signingIn ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon className="h-4 w-4" />}
            {signingIn ? "Redirecting..." : "Sign in with Google"}
          </button>

          {error && <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>}

          <Link
            href="/"
            className="mt-6 block text-xs text-muted-foreground transition hover:text-foreground"
          >
            ← Back to the homepage
          </Link>
        </div>
      </main>
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
