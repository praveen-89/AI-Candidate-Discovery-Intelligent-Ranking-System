"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";

interface StatCounterProps {
  /** Numeric value to count up to. */
  value: number;
  /** Text shown before the number, e.g. "~". */
  prefix?: string;
  /** Text shown after the number, e.g. "s" or "+". */
  suffix?: string;
  duration?: number;
  className?: string;
}

/**
 * A mono, tabular-numeral counter that animates from 0 to `value` once it
 * scrolls into view. Respects prefers-reduced-motion (jumps straight to the
 * final value instead of animating).
 */
export function StatCounter({ value, prefix = "", suffix = "", duration = 1.2, className }: StatCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const prefersReducedMotion = useReducedMotion();
  const [display, setDisplay] = useState(prefersReducedMotion ? value : 0);

  useEffect(() => {
    if (!inView || prefersReducedMotion) {
      if (prefersReducedMotion) setDisplay(value);
      return;
    }

    let raf: number;
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = (now - start) / 1000;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setDisplay(Math.round(eased * value));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, prefersReducedMotion, value, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {display.toLocaleString("en-US")}
      {suffix}
    </span>
  );
}
