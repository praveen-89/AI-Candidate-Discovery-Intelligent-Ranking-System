"use client";

import { useState } from "react";
import { Play, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { runRanking } from "@/lib/api/ranking";
import { cn } from "@/lib/utils/cn";
import { formatLatency } from "@/lib/utils/format";

type RankingState = "idle" | "running" | "success" | "error";

interface RunRankingButtonProps {
  onSuccess?: () => void;
}

export function RunRankingButton({ onSuccess }: RunRankingButtonProps) {
  const [state, setState] = useState<RankingState>("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [stats, setStats] = useState<{ time: number; total: number; top: number } | null>(null);

  const handleRun = async () => {
    setState("running");
    setErrorMsg("");
    setStats(null);

    try {
      const result = await runRanking();
      setStats({
        time: result.processing_time,
        total: result.total_candidates,
        top: result.top_candidates,
      });
      setState("success");
      onSuccess?.();
      
      // Reset back to idle after a few seconds
      setTimeout(() => setState("idle"), 5000);
    } catch (err: unknown) {
      setState("error");
      setErrorMsg(err instanceof Error ? err.message : "An unknown error occurred");
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        onClick={handleRun}
        disabled={state === "running"}
        className={cn(
          "group relative flex items-center gap-3 overflow-hidden rounded-xl px-8 py-4 font-semibold shadow-lg transition-all",
          state === "idle" && "bg-violet-600 text-white hover:bg-violet-500 hover:shadow-violet-500/25",
          state === "running" && "bg-border text-muted-foreground cursor-wait",
          state === "success" && "bg-emerald-600 text-white",
          state === "error" && "bg-red-600 text-white hover:bg-red-500"
        )}
      >
        {state === "idle" && (
          <>
            <Play className="h-5 w-5 transition-transform group-hover:scale-110" />
            Run AI Ranking
          </>
        )}
        {state === "running" && (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            AI Ranking in progress...
          </>
        )}
        {state === "success" && (
          <>
            <CheckCircle2 className="h-5 w-5" />
            Ranking Complete
          </>
        )}
        {state === "error" && (
          <>
            <XCircle className="h-5 w-5" />
            Ranking Failed — Retry
          </>
        )}
      </button>

      {/* Status Messages */}
      {state === "success" && stats && (
        <div className="text-center animate-in fade-in slide-in-from-bottom-2">
          <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Successfully generated new rankings!</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Processed {stats.total.toLocaleString()} candidates in {formatLatency(stats.time)}.
          </p>
        </div>
      )}
      
      {state === "error" && errorMsg && (
        <div className="max-w-md text-center animate-in fade-in slide-in-from-bottom-2">
          <p className="text-sm font-medium text-red-600 dark:text-red-400">Failed to execute ranking.</p>
          <p className="mt-1 text-xs text-muted-foreground">{errorMsg}</p>
        </div>
      )}
    </div>
  );
}
