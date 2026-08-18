"use client";

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="animate-pulse rounded-xl border border-slate-700/50 bg-slate-800/50 p-6">
      <div className="mb-4 h-4 w-1/3 rounded bg-slate-700/60" />
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="mb-2 h-3 rounded bg-slate-700/40"
          style={{ width: `${70 + (i % 3) * 10}%` }}
        />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 8 }: { rows?: number }) {
  return (
    <div className="animate-pulse space-y-2">
      {/* Header */}
      <div className="mb-3 flex gap-4 rounded-lg bg-slate-800/80 p-3">
        {[20, 25, 15, 15, 10, 15].map((w, i) => (
          <div key={i} className="h-3 rounded bg-slate-700/60" style={{ width: `${w}%` }} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 rounded-lg bg-slate-800/30 p-3">
          {[20, 25, 15, 15, 10, 15].map((w, j) => (
            <div key={j} className="h-3 rounded bg-slate-700/40" style={{ width: `${w}%` }} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonDetail() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-6">
        <div className="mb-3 h-6 w-1/4 rounded bg-slate-700/60" />
        <div className="h-10 w-1/5 rounded bg-slate-700/40" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-6">
            <div className="mb-4 h-4 w-1/3 rounded bg-slate-700/60" />
            <div className="space-y-3">
              {[1, 2, 3].map((j) => (
                <div key={j} className="h-3 rounded bg-slate-700/40" style={{ width: `${60 + j * 10}%` }} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
