"use client";

import { Menu, Activity } from "lucide-react";
import { useEffect, useState } from "react";
import { getHealth } from "@/lib/api/health";

interface TopNavProps {
  onMenuToggle: () => void;
  pageTitle: string;
}

export function TopNav({ onMenuToggle, pageTitle }: TopNavProps) {
  const [backendStatus, setBackendStatus] = useState<"checking" | "online" | "offline">("checking");

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

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-700/50 bg-slate-900/80 px-4 backdrop-blur-sm lg:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="rounded-md p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200 lg:hidden"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-base font-semibold text-slate-100">{pageTitle}</h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Backend status indicator */}
        <div className="flex items-center gap-2 rounded-full border border-slate-700/50 bg-slate-800/50 px-3 py-1.5 text-xs">
          <Activity className="h-3.5 w-3.5 text-slate-400" />
          {backendStatus === "checking" && (
            <span className="text-slate-400">Connecting...</span>
          )}
          {backendStatus === "online" && (
            <>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span className="text-emerald-400 font-medium">API Online</span>
            </>
          )}
          {backendStatus === "offline" && (
            <>
              <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
              <span className="text-red-400 font-medium">API Offline</span>
            </>
          )}
        </div>

        {/* User avatar placeholder */}
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-xs font-bold text-white select-none">
          R
        </div>
      </div>
    </header>
  );
}
