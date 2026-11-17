import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface ButtonProps {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
  icon?: ReactNode;
  external?: boolean;
}

const VARIANTS = {
  primary: "bg-mkt-accent text-mkt-accent-ink hover:brightness-95",
  secondary: "border border-mkt-border text-mkt-text hover:bg-mkt-surface-hover",
  ghost: "text-mkt-text-secondary hover:text-mkt-text",
};

export function Button({ href, children, variant = "primary", className, icon, external }: ButtonProps) {
  const classes = cn(
    "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold transition",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mkt-accent focus-visible:ring-offset-2 focus-visible:ring-offset-mkt-bg",
    VARIANTS[variant],
    className
  );

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classes}>
        {children}
        {icon}
      </a>
    );
  }

  return (
    <Link href={href} className={classes}>
      {children}
      {icon}
    </Link>
  );
}
