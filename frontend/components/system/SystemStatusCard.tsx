"use client";

import { type LucideIcon } from "lucide-react";

interface SystemStatusCardProps {
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
}

export function SystemStatusCard({ title, icon: Icon, children }: SystemStatusCardProps) {
  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 overflow-hidden">
      <div className="flex items-center gap-3 border-b border-slate-700/50 bg-slate-800/50 px-5 py-4">
        <Icon className="h-5 w-5 text-violet-400" />
        <h3 className="font-semibold text-slate-100">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export function SystemStatusRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between py-2 border-b border-slate-700/30 last:border-0 last:pb-0">
      <span className="text-sm text-slate-400">{label}</span>
      <span className="text-sm font-medium text-slate-200 text-right">{value}</span>
    </div>
  );
}
