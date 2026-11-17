"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Circle } from "lucide-react";
import { getHealth } from "@/lib/api/health";
import { getAIStatus } from "@/lib/api/system";
import { cn } from "@/lib/utils/cn";
import type { AIStatusResponse } from "@/types/system";

type Phase = "warming" | "ready" | "offline";

/**
 * 28px IDE-style status bar — system health moves out of the main view
 * entirely. Shows a "warming up" readout during the backend's cold-start
 * (model + index load, up to ~15s) instead of a blank screen or a spinner.
 */
export function StatusBar() {
  const [phase, setPhase] = useState<Phase>("warming");
  const [aiStatus, setAiStatus] = useState<AIStatusResponse | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      try {
        await getHealth();
        const status = await getAIStatus();
        if (cancelled) return;
        setAiStatus(status);
        setPhase(status.engine === "ready" ? "ready" : "warming");
        setLastChecked(new Date());
      } catch {
        if (!cancelled) setPhase("offline");
      }
    };

    void check();
    const interval = setInterval(check, 15000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const dotClass =
    phase === "ready" ? "text-positive" : phase === "warming" ? "text-caution" : "text-negative";

  return (
    <Link
      href="/system"
      className="flex h-7 shrink-0 items-center gap-4 border-t border-border bg-surface px-3 font-mono text-[11px] text-muted-foreground transition hover:bg-surface-hover"
    >
      <span className="flex items-center gap-1.5">
        <Circle className={cn("h-2 w-2 fill-current", dotClass)} strokeWidth={0} />
        {phase === "offline" ? "API unreachable" : "API"}
      </span>
      {phase === "warming" && <span className="text-caution">Warming up engine…</span>}
      {aiStatus && phase === "ready" && (
        <>
          <span>Model BAAI/bge-small loaded</span>
          <span>{aiStatus.vectors.toLocaleString("en-US")} vectors</span>
          <span>cache {aiStatus.cache}</span>
        </>
      )}
      {lastChecked && (
        <span className="ml-auto">
          last check {lastChecked.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
        </span>
      )}
    </Link>
  );
}
