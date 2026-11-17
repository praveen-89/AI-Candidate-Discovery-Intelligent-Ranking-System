"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export interface TabItem {
  label: string;
  content: ReactNode;
}

export function Tabs({ items }: { items: TabItem[] }) {
  const [active, setActive] = useState(0);

  return (
    <div>
      <div className="inline-flex rounded-md border border-mkt-border bg-mkt-surface p-0.5">
        {items.map((item, i) => (
          <button
            key={item.label}
            onClick={() => setActive(i)}
            className={cn(
              "rounded px-3 py-1.5 text-sm font-medium transition",
              i === active ? "bg-mkt-accent text-mkt-accent-ink" : "text-mkt-text-secondary hover:text-mkt-text"
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="mt-4">{items[active].content}</div>
    </div>
  );
}
