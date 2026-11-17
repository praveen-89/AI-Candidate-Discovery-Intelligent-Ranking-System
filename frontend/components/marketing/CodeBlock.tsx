"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function CodeBlock({ code, label }: { code: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard access can fail (permissions, insecure context) — not worth surfacing an error for.
    }
  };

  return (
    <div className="overflow-hidden rounded-lg border border-mkt-border bg-mkt-bg">
      {label && (
        <div className="border-b border-mkt-border px-4 py-2 font-mono text-[11px] text-mkt-text-secondary">
          {label}
        </div>
      )}
      <div className="relative">
        <pre className="overflow-x-auto p-4 font-mono text-xs leading-relaxed text-mkt-text">
          <code>{code}</code>
        </pre>
        <button
          onClick={handleCopy}
          className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-md border border-mkt-border bg-mkt-surface text-mkt-text-secondary transition hover:text-mkt-text"
          aria-label="Copy to clipboard"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>
    </div>
  );
}
