"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Users, Briefcase, Upload, PlayCircle, Settings } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const ITEMS = [
  { href: "/dashboard", label: "Overview", icon: LayoutGrid },
  { href: "/candidates", label: "Candidates", icon: Users },
  { href: "/jobs", label: "Jobs", icon: Briefcase },
  { href: "/uploads", label: "Uploads", icon: Upload },
  { href: "/ranking", label: "Runs", icon: PlayCircle },
  { href: "/system", label: "System", icon: Settings },
];

/**
 * 56px icon rail — not five equal-weight icons as decoration, but the fixed
 * set of scopes the job-first model needs: see candidates, manage jobs,
 * upload resumes, watch runs, check the engine.
 */
export function LeftRail() {
  const pathname = usePathname();

  return (
    <nav className="flex w-14 shrink-0 flex-col items-center gap-1 border-r border-border bg-surface py-3">
      {ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            title={label}
            className={cn(
              "group relative flex h-10 w-10 items-center justify-center rounded-[6px] transition",
              active ? "bg-surface-hover text-accent-fg" : "text-muted-foreground hover:bg-surface-hover hover:text-foreground"
            )}
          >
            <Icon className="h-[18px] w-[18px]" strokeWidth={1.5} />
            {active && <span className="absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-full bg-accent-fg" />}
            <span className="pointer-events-none absolute left-full ml-2 whitespace-nowrap rounded-[4px] border border-border bg-surface px-2 py-1 text-xs text-foreground opacity-0 shadow-sm transition group-hover:opacity-100 z-50">
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
