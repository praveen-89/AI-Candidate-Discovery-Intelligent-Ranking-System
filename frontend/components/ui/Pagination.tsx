"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}

export function Pagination({ page, pageSize, total, onPageChange, disabled }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  // Show up to 5 page numbers centered on the current page.
  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
  const end = Math.min(totalPages, start + 4);
  const pageNumbers = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  return (
    <div className="flex items-center justify-between gap-2 pt-2">
      <p className="text-xs text-muted-foreground">
        {total.toLocaleString("en-IN")} candidates &middot; page {page} of {totalPages}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={disabled || page <= 1}
          className="rounded-md p-1.5 text-muted-foreground transition hover:bg-surface-hover hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {pageNumbers.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            disabled={disabled}
            className={cn(
              "h-7 w-7 rounded-md text-xs font-medium transition",
              p === page ? "bg-violet-600 text-white" : "text-muted-foreground hover:bg-surface-hover hover:text-foreground"
            )}
          >
            {p}
          </button>
        ))}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={disabled || page >= totalPages}
          className="rounded-md p-1.5 text-muted-foreground transition hover:bg-surface-hover hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent"
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
