"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Command, LogOut } from "lucide-react";
import { LeftRail } from "./LeftRail";
import { JobSwitcher } from "./JobSwitcher";
import { StatusBar } from "./StatusBar";
import { CommandPalette } from "./CommandPalette";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { createClient } from "@/lib/supabase/client";
import type { JobRecord } from "@/types/job";

interface AppFrameProps {
  children: React.ReactNode;
  pageTitle: string;
  jobs: JobRecord[];
  activeJobId: string | null;
  onJobSelect: (jobId: string) => void;
}

/**
 * The "Shortlist Ledger" app frame: 52px top bar (job switcher, breadcrumb,
 * command palette trigger, theme, user), 56px left icon rail, main content,
 * 28px status bar. Replaces AppShell/Sidebar/TopNav for pages migrated to
 * the redesign (Overview first; other screens follow in later rounds).
 */
export function AppFrame({ children, pageTitle, jobs, activeJobId, onJobSelect }: AppFrameProps) {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data }) => setUserEmail(data.user?.email ?? null));
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <header className="flex h-[52px] shrink-0 items-center gap-4 border-b border-border px-3">
        <JobSwitcher jobs={jobs} activeJobId={activeJobId} onSelect={onJobSelect} />
        <span className="text-sm text-tertiary-foreground">/</span>
        <h1 className="text-sm font-medium text-foreground">{pageTitle}</h1>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))}
            className="flex items-center gap-1.5 rounded-[6px] border border-border px-2.5 py-1.5 text-xs text-muted-foreground transition hover:bg-surface-hover hover:text-foreground"
          >
            <Command className="h-3.5 w-3.5" strokeWidth={1.5} />
            <kbd className="font-mono">K</kbd>
          </button>
          <ThemeToggle />
          <div
            className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-fg text-[11px] font-semibold text-white select-none"
            title={userEmail ?? undefined}
          >
            {userEmail ? userEmail[0].toUpperCase() : "?"}
          </div>
          <button
            onClick={handleSignOut}
            className="flex h-7 w-7 items-center justify-center rounded-[6px] text-muted-foreground transition hover:bg-surface-hover hover:text-foreground"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut className="h-3.5 w-3.5" strokeWidth={1.5} />
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <LeftRail />
        <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
      </div>

      <StatusBar />
      <CommandPalette jobs={jobs} onSelectJob={onJobSelect} />
    </div>
  );
}
