"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import type { CandidateResult } from "@/types/candidate";
import { formatScore, scoreColorClass } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

const PAGE_SIZE = 25;

type SortKey = "final_score" | "matched_experience";
type SortDir = "asc" | "desc";

interface CandidateTableProps {
  candidates: CandidateResult[];
}

function SortIcon({ column, sortKey, sortDir }: { column: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (column !== sortKey) return <ChevronsUpDown className="h-3 w-3 text-muted-foreground" />;
  return sortDir === "desc"
    ? <ChevronDown className="h-3 w-3 text-accent-fg" />
    : <ChevronUp className="h-3 w-3 text-accent-fg" />;
}

export function CandidateTable({ candidates }: CandidateTableProps) {
  const [search, setSearch] = useState("");
  const [minScore, setMinScore] = useState(0);
  const [sortKey, setSortKey] = useState<SortKey>("final_score");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let list = candidates.filter((c) => {
      const matchSearch = search === "" || c.candidate_id.toLowerCase().includes(search.toLowerCase());
      const matchScore = c.final_score >= minScore / 100;
      return matchSearch && matchScore;
    });

    list = [...list].sort((a, b) => {
      let aVal = sortKey === "final_score" ? a.final_score : a.reasons.matched_experience;
      let bVal = sortKey === "final_score" ? b.final_score : b.reasons.matched_experience;
      return sortDir === "desc" ? bVal - aVal : aVal - bVal;
    });

    return list;
  }, [candidates, search, minScore, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
    setPage(1);
  }

  function handleSearch(v: string) {
    setSearch(v);
    setPage(1);
  }

  function handleMinScore(v: number) {
    setMinScore(v);
    setPage(1);
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search candidate ID..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-4 text-sm text-muted-foreground placeholder-muted-foreground outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground whitespace-nowrap">Min score</label>
          <input
            type="number"
            min={0}
            max={100}
            step={5}
            value={minScore}
            onChange={(e) => handleMinScore(Number(e.target.value))}
            className="w-20 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-muted-foreground outline-none focus:border-violet-500/50"
          />
          <span className="text-xs text-muted-foreground">%</span>
        </div>
        <p className="ml-auto text-xs text-muted-foreground">
          {filtered.length} candidate{filtered.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[800px] text-sm">
          <thead className="border-b border-border bg-surface">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Rank</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Candidate ID</th>
              <th
                className="cursor-pointer px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
                onClick={() => toggleSort("final_score")}
              >
                <span className="inline-flex items-center gap-1">
                  Final Score <SortIcon column="final_score" sortKey={sortKey} sortDir={sortDir} />
                </span>
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Semantic</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Skill</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Education</th>
              <th
                className="cursor-pointer px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
                onClick={() => toggleSort("matched_experience")}
              >
                <span className="inline-flex items-center gap-1">
                  Experience <SortIcon column="matched_experience" sortKey={sortKey} sortDir={sortDir} />
                </span>
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Top Skills</th>
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                  No candidates match your filters.
                </td>
              </tr>
            ) : (
              paged.map((c, idx) => {
                const globalRank = (currentPage - 1) * PAGE_SIZE + idx + 1;
                // Compute original rank from full sorted-by-score list
                const originalRank = candidates.findIndex((x) => x.candidate_id === c.candidate_id) + 1;
                return (
                  <tr
                    key={c.candidate_id}
                    className="border-b border-border transition-colors hover:bg-surface-hover"
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-muted-foreground">#{originalRank}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/candidates/${c.candidate_id}`}
                        className="font-mono font-medium text-muted-foreground hover:text-accent-fg transition-colors"
                      >
                        {c.candidate_id}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={cn("font-bold", scoreColorClass(c.final_score))}>
                        {formatScore(c.final_score)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                      {formatScore(c.sub_scores.semantic)}
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                      {formatScore(c.sub_scores.skill)}
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                      {formatScore(c.sub_scores.education)}
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                      {c.reasons.matched_experience.toFixed(1)}y
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(c.reasons.top_matching_skills ?? []).slice(0, 3).map((skill) => (
                          <span
                            key={skill}
                            className="rounded bg-violet-600/15 px-1.5 py-0.5 text-[10px] font-medium text-accent-fg"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Page {currentPage} of {totalPages} &bull; showing {paged.length} of {filtered.length}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground transition hover:bg-surface-hover disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground transition hover:bg-surface-hover disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
