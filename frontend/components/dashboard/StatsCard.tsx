"use client";

import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: string;
  accent?: "violet" | "sky" | "emerald" | "amber";
  className?: string;
}

const ACCENT_STYLES = {
  violet: {
    icon: "bg-violet-500/15 text-accent-fg",
    glow: "shadow-violet-500/5",
  },
  sky: {
    icon: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
    glow: "shadow-sky-500/5",
  },
  emerald: {
    icon: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    glow: "shadow-emerald-500/5",
  },
  amber: {
    icon: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    glow: "shadow-amber-500/5",
  },
};

export function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  accent = "violet",
  className,
}: StatsCardProps) {
  const styles = ACCENT_STYLES[accent];

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border border-border bg-surface p-5 shadow-lg transition-all duration-200 hover:border-muted-foreground hover:bg-surface-hover",
        styles.glow,
        className
      )}
    >
      {/* Subtle top gradient line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {title}
          </p>
          <p className="text-3xl font-bold tracking-tight text-foreground">{value}</p>
          {subtitle && (
            <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div className={cn("rounded-xl p-2.5", styles.icon)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
