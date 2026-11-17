"use client";

import { Menu, Activity, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getHealth } from "@/lib/api/health";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

interface TopNavProps {
  onMenuToggle: () => void;
  pageTitle: string;
}

export function TopNav({ onMenuToggle, pageTitle }: TopNavProps) {
  const [backendStatus, setBackendStatus] = useState<"checking" | "online" | "offline">("checking");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const check = async () => {
      try {
        await getHealth();
        setBackendStatus("online");
      } catch {
        setBackendStatus("offline");
      }
    };
    void check();
    // Re-check every 30s
    const interval = setInterval(() => void check(), 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null);
    });
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-surface/80 px-4 backdrop-blur-sm lg:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="rounded-md p-2 text-muted-foreground hover:bg-surface-hover hover:text-foreground lg:hidden"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-base font-semibold text-foreground">{pageTitle}</h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Backend status indicator */}
        <div className="flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs">
          <Activity className="h-3.5 w-3.5 text-muted-foreground" />
          {backendStatus === "checking" && (
            <span className="text-muted-foreground">Connecting...</span>
          )}
          {backendStatus === "online" && (
            <>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">API Online</span>
            </>
          )}
          {backendStatus === "offline" && (
            <>
              <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
              <span className="text-red-600 dark:text-red-400 font-medium">API Offline</span>
            </>
          )}
        </div>

        <ThemeToggle />

        {/* Signed-in user */}
        <div className="flex items-center gap-2">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-600 text-xs font-semibold text-white select-none"
            title={userEmail ?? undefined}
          >
            {userEmail ? userEmail[0].toUpperCase() : "?"}
          </div>
          <button
            onClick={handleSignOut}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-surface-hover hover:text-foreground"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
