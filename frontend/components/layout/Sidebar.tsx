"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Trophy,
  Briefcase,
  Monitor,
  Brain,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/candidates", label: "Candidates", icon: Users },
  { href: "/ranking", label: "Ranking", icon: Trophy },
  { href: "/jobs", label: "Jobs", icon: Briefcase },
  { href: "/system", label: "System Status", icon: Monitor },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-surface transition-transform duration-300 lg:relative lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-violet-600">
              <Brain className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-none text-foreground">AI Talent</p>
              <p className="text-[10px] text-muted-foreground">Intelligence</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-surface-hover hover:text-foreground lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Navigation
          </div>
          <ul className="space-y-0.5">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(href + "/");
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={onClose}
                    className={cn(
                      "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-violet-600/20 text-accent-fg"
                        : "text-muted-foreground hover:bg-surface-hover hover:text-foreground"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0 transition-colors",
                        active ? "text-accent-fg" : "text-muted-foreground group-hover:text-foreground"
                      )}
                    />
                    {label}
                    {active && (
                      <div className="ml-auto h-1.5 w-1.5 rounded-full bg-violet-400" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="border-t border-border px-6 py-4">
          <p className="text-[10px] text-muted-foreground">
            AI Talent Intelligence Platform
          </p>
          <p className="text-[10px] text-muted-foreground">BAAI/bge-small-en-v1.5</p>
        </div>
      </aside>
    </>
  );
}
