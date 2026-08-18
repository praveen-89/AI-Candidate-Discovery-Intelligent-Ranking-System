"use client";

import React from "react";
import { cn } from "../../lib/utils/cn";

type StatusVariant =
  | "ready"
  | "healthy"
  | "loaded"
  | "success"
  | "warning"
  | "error"
  | "offline"
  | "running"
  | "missing"
  | "not_ready"
  | "unknown";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const VARIANT_MAP: Record<string, StatusVariant> = {
  ready: "ready",
  healthy: "healthy",
  ok: "healthy",
  loaded: "loaded",
  success: "success",
  warning: "warning",
  error: "error",
  offline: "offline",
  running: "running",
  missing: "error",
  not_ready: "error",
};

const VARIANT_STYLES: Record<StatusVariant, string> = {
  ready: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  healthy: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  loaded: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  success: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  warning: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  error: "bg-red-500/15 text-red-400 border-red-500/30",
  offline: "bg-slate-500/15 text-slate-400 border-slate-500/30",
  running: "bg-violet-500/15 text-violet-400 border-violet-500/30",
  missing: "bg-red-500/15 text-red-400 border-red-500/30",
  not_ready: "bg-red-500/15 text-red-400 border-red-500/30",
  unknown: "bg-slate-500/15 text-slate-400 border-slate-500/30",
};

const DOT_STYLES: Record<StatusVariant, string> = {
  ready: "bg-emerald-400",
  healthy: "bg-emerald-400",
  loaded: "bg-sky-400",
  success: "bg-emerald-400",
  warning: "bg-amber-400",
  error: "bg-red-400",
  offline: "bg-slate-400",
  running: "bg-violet-400 animate-pulse",
  missing: "bg-red-400",
  not_ready: "bg-red-400",
  unknown: "bg-slate-400",
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const key = status.toLowerCase().replace(/\s+/g, "_");
  const variant: StatusVariant = VARIANT_MAP[key] ?? "unknown";
  const label = status.toUpperCase().replace(/_/g, " ");

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold tracking-wide",
        VARIANT_STYLES[variant],
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", DOT_STYLES[variant])} />
      {label}
    </span>
  );
}
