"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Star } from "lucide-react";
import { ThemeToggleMkt } from "./ThemeToggleMkt";
import { Button } from "./Button";
import { cn } from "@/lib/utils/cn";

const GITHUB_URL = "https://github.com/praveen-89/AI-Candidate-Discovery-Intelligent-Ranking-System";

const NAV_LINKS = [
  { href: "/product", label: "Product" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/scoring", label: "Scoring" },
  { href: "/architecture", label: "Architecture" },
  { href: "/use-cases", label: "Use Cases" },
  { href: "/docs", label: "Docs" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b transition-colors",
        scrolled ? "border-mkt-border bg-mkt-bg/80 backdrop-blur-md" : "border-transparent bg-transparent"
      )}
    >
      <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <MiniScoreBarMark />
          <span className="font-display text-sm font-semibold tracking-tight text-mkt-text">
            AI Talent Intelligence
          </span>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm transition hover:text-mkt-text",
                pathname === link.href ? "text-mkt-text" : "text-mkt-text-secondary"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <ThemeToggleMkt />
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-md border border-mkt-border px-3 py-1.5 text-sm text-mkt-text-secondary transition hover:border-mkt-text-secondary hover:text-mkt-text"
          >
            <Star className="h-3.5 w-3.5" />
            GitHub
          </a>
          <Button href="/login" className="px-4 py-1.5">
            Get Started
          </Button>
        </div>

        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="flex h-9 w-9 items-center justify-center rounded-md text-mkt-text lg:hidden"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-mkt-border bg-mkt-bg px-6 py-4 lg:hidden">
          <nav className="flex flex-col gap-4">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="text-sm text-mkt-text-secondary transition hover:text-mkt-text"
              >
                {link.label}
              </Link>
            ))}
            <div className="flex items-center justify-between pt-2">
              <ThemeToggleMkt />
              <Button href="/login">Get Started</Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

/** Mini 8-segment score bar used as part of the wordmark. */
function MiniScoreBarMark() {
  const colors = [
    "var(--color-factor-semantic)",
    "var(--color-factor-skill)",
    "var(--color-factor-experience)",
    "var(--color-factor-career)",
    "var(--color-factor-behavioral)",
    "var(--color-factor-education)",
    "var(--color-factor-availability)",
    "var(--color-factor-location)",
  ];
  return (
    <span className="flex h-4 w-7 overflow-hidden rounded-sm">
      {colors.map((c, i) => (
        <span key={i} className="h-full flex-1" style={{ backgroundColor: c }} />
      ))}
    </span>
  );
}
