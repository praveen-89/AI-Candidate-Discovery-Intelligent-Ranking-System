import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/** A plain browser-chrome frame wrapping a UI mock — no screenshot needed. */
export function BrowserFrame({
  children,
  url = "app.aitalentintelligence.com/ranking",
  className,
}: {
  children: ReactNode;
  url?: string;
  className?: string;
}) {
  return (
    <div className={cn("overflow-hidden rounded-xl border border-mkt-border bg-mkt-surface shadow-sm", className)}>
      <div className="flex items-center gap-2 border-b border-mkt-border px-4 py-2.5">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-mkt-border" />
          <span className="h-2.5 w-2.5 rounded-full bg-mkt-border" />
          <span className="h-2.5 w-2.5 rounded-full bg-mkt-border" />
        </div>
        <div className="ml-2 flex-1 rounded bg-mkt-bg px-3 py-1 text-center font-mono text-[11px] text-mkt-text-secondary">
          {url}
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}
