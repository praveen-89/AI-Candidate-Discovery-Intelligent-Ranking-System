"use client";

import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatNumber } from "@/lib/utils/format";
import type { AIStatusResponse, CacheStatusResponse } from "@/types/system";
import { Brain, Database, Layers } from "lucide-react";

interface AIEngineStatusProps {
  aiStatus: AIStatusResponse;
  cacheStatus: CacheStatusResponse;
}

export function AIEngineStatus({ aiStatus, cacheStatus }: AIEngineStatusProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {/* Engine */}
      <div className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
          <Brain className="h-5 w-5 text-accent-fg" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">AI Engine</p>
          <StatusBadge status={aiStatus.engine} className="mt-1" />
        </div>
      </div>

      {/* FAISS Cache */}
      <div className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10">
          <Database className="h-5 w-5 text-sky-600 dark:text-sky-400" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">FAISS Cache</p>
          <StatusBadge status={aiStatus.cache} className="mt-1" />
          {aiStatus.vectors > 0 && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {formatNumber(aiStatus.vectors)} vectors
            </p>
          )}
        </div>
      </div>

      {/* Model */}
      <div className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
          <Layers className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">Embedding Model</p>
          <p className="mt-1 truncate text-xs font-medium text-muted-foreground">
            {cacheStatus.model || "—"}
          </p>
          <p className="truncate text-[10px] text-muted-foreground">{cacheStatus.dataset || "—"}</p>
        </div>
      </div>
    </div>
  );
}
