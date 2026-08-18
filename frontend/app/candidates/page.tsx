"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { CandidateTable } from "@/components/candidates/CandidateTable";
import { SkeletonTable } from "@/components/ui/SkeletonCard";
import { ErrorState } from "@/components/ui/ErrorState";
import { getResults } from "@/lib/api/candidates";
import type { CandidateResult } from "@/types/candidate";

export default function CandidatesPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [candidates, setCandidates] = useState<CandidateResult[]>([]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const resData = await getResults();
      setCandidates(resData.results || []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  return (
    <AppShell pageTitle="Candidates">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-100">Ranked Candidates</h2>
        <p className="mt-1 text-sm text-slate-400">
          Browse and filter all candidates processed by the AI Engine.
        </p>
      </div>

      <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-4 shadow-lg">
        {loading ? (
          <SkeletonTable rows={10} />
        ) : error ? (
          <ErrorState error={error} onRetry={loadData} />
        ) : (
          <CandidateTable candidates={candidates} />
        )}
      </div>
    </AppShell>
  );
}
