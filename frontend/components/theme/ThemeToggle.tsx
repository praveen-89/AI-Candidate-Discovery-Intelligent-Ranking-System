"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const OPTIONS = [
  { value: "light", icon: Sun, label: "Light theme" },
  { value: "system", icon: Monitor, label: "Match system theme" },
  { value: "dark", icon: Moon, label: "Dark theme" },
] as const;

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  // next-themes can't know the real preference until after hydration (it
  // reads localStorage client-side) — render a stable placeholder until then
  // to avoid a server/client mismatch.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className={cn("h-8 w-24", className)} />;
  }

  return (
    <div className={cn("inline-flex items-center gap-0.5 rounded-md border border-border bg-surface p-0.5", className)}>
      {OPTIONS.map(({ value, icon: Icon, label }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            onClick={() => setTheme(value)}
            className={cn(
              "flex h-6 w-7 items-center justify-center rounded transition",
              active ? "bg-violet-600 text-white" : "text-muted-foreground hover:bg-surface-hover hover:text-foreground"
            )}
            aria-label={label}
            aria-pressed={active}
            title={label}
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        );
      })}
    </div>
  );
}
