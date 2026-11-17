"use client";

import { type LucideIcon } from "lucide-react";

interface SystemStatusCardProps {
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
}

export function SystemStatusCard({ title, icon: Icon, children }: SystemStatusCardProps) {
  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden">
      <div className="flex items-center gap-3 border-b border-border bg-surface px-5 py-4">
        <Icon className="h-5 w-5 text-accent-fg" />
        <h3 className="font-semibold text-foreground">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export function SystemStatusRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between py-2 border-b border-border last:border-0 last:pb-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-muted-foreground text-right">{value}</span>
    </div>
  );
}
