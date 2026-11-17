"use client";

import { useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";

interface DistributionRibbonProps {
  /** Final scores (0–1) for the candidate set this ribbon summarizes. */
  scores: number[];
  /** Shortlist threshold, 0–100. Uncontrolled if omitted (manages its own state). */
  value?: number;
  onChange?: (value: number) => void;
  className?: string;
}

const BUCKET_COUNT = 20;

/**
 * A compact histogram of final scores with a draggable vertical "shortlist
 * line" — everything right of the line is the working shortlist.
 */
export function DistributionRibbon({ scores, value, onChange, className }: DistributionRibbonProps) {
  const [internalValue, setInternalValue] = useState(70);
  const threshold = value ?? internalValue;
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  const buckets = useMemo(() => {
    const counts = new Array(BUCKET_COUNT).fill(0);
    for (const s of scores) {
      const idx = Math.min(BUCKET_COUNT - 1, Math.floor(s * 100 * (BUCKET_COUNT / 100)));
      counts[idx]++;
    }
    return counts;
  }, [scores]);

  const maxCount = Math.max(1, ...buckets);
  const aboveCount = scores.filter((s) => s * 100 >= threshold).length;

  const setFromClientX = (clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return;
    const pct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    onChange ? onChange(pct) : setInternalValue(pct);
  };

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-baseline justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
          Score distribution
        </p>
        <p className="font-mono text-xs text-foreground">
          {aboveCount} above {Math.round(threshold)}
        </p>
      </div>

      <div
        ref={trackRef}
        className="relative mt-3 h-16 cursor-ew-resize select-none"
        onPointerDown={(e) => {
          setDragging(true);
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
          setFromClientX(e.clientX);
        }}
        onPointerMove={(e) => dragging && setFromClientX(e.clientX)}
        onPointerUp={() => setDragging(false)}
        role="slider"
        aria-label="Shortlist score threshold"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(threshold)}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") onChange ? onChange(Math.max(0, threshold - 1)) : setInternalValue((v) => Math.max(0, v - 1));
          if (e.key === "ArrowRight") onChange ? onChange(Math.min(100, threshold + 1)) : setInternalValue((v) => Math.min(100, v + 1));
        }}
      >
        <div className="flex h-full items-end gap-[1px]">
          {buckets.map((count, i) => {
            const bucketStart = (i / BUCKET_COUNT) * 100;
            const isShortlisted = bucketStart >= threshold;
            return (
              <div
                key={i}
                className={cn("flex-1 rounded-t-[1px] transition-colors", isShortlisted ? "bg-accent-fg" : "bg-border")}
                style={{ height: `${(count / maxCount) * 100}%`, minHeight: count > 0 ? 2 : 0 }}
              />
            );
          })}
        </div>
        <div
          className="pointer-events-none absolute top-0 h-full w-px bg-foreground"
          style={{ left: `${threshold}%` }}
        >
          <div className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-foreground" />
        </div>
      </div>
      <div className="mt-1 flex justify-between font-mono text-[10px] text-tertiary-foreground">
        <span>0</span>
        <span>100</span>
      </div>
    </div>
  );
}
