"use client";

import { type LucideIcon, SearchX } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: LucideIcon;
}

export function EmptyState({
  title = "No Results",
  message = "No data is available yet.",
  icon: Icon = SearchX,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-slate-700/40 bg-slate-800/20 px-6 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-700/50">
        <Icon className="h-7 w-7 text-slate-500" />
      </div>
      <h3 className="mb-1 text-base font-semibold text-slate-300">{title}</h3>
      <p className="max-w-sm text-sm text-slate-500">{message}</p>
    </div>
  );
}
