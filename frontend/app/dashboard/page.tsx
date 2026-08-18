"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { TopCandidatesTable } from "@/components/dashboard/TopCandidatesTable";
import { AIEngineStatus } from "@/components/dashboard/AIEngineStatus";
import { SkeletonCard, SkeletonTable } from "@/components/ui/SkeletonCard";
import { ErrorState } from "@/components/ui/ErrorState";
import { Users, Trophy, Star, Target } from "lucide-react";
import { getResults } from "@/lib/api/candidates";
import { getAIStatus, getCacheStatus } from "@/lib/api/system";
import { formatNumber, scoreTo100 } from "@/lib/utils/format";
import type { CandidateResult } from "@/types/candidate";
import type { AIStatusResponse, CacheStatusResponse } from "@/types/system";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  
  const [candidates, setCandidates] = useState<CandidateResult[]>([]);
  const [aiStatus, setAiStatus] = useState<AIStatusResponse | null>(null);
  const [cacheStatus, setCacheStatus] = useState<CacheStatusResponse | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [resData, ai, cache] = await Promise.all([
        getResults(),
        getAIStatus(),
        getCacheStatus(),
      ]);
      setCandidates(resData.results || []);
      setAiStatus(ai);
      setCacheStatus(cache);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  if (error) {
    return (
      <AppShell pageTitle="Dashboard">
        <ErrorState error={error} onRetry={loadData} />
      </AppShell>
    );
  }

  const top10 = candidates.slice(0, 10);
  const topScore = candidates.length > 0 ? candidates[0].final_score : 0;
  const avgScore = candidates.length > 0 
    ? candidates.reduce((acc, c) => acc + c.final_score, 0) / candidates.length 
    : 0;

  return (
    <AppShell pageTitle="Dashboard">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-100">Welcome to AI Talent Intelligence</h2>
        <p className="text-sm text-slate-400 mt-1">
          Discover, rank and understand the best candidates using semantic retrieval and hybrid AI scoring.
        </p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <StatsCard
              title="Ranked Candidates"
              value={formatNumber(candidates.length)}
              icon={Users}
              accent="violet"
            />
            <StatsCard
              title="Top Score"
              value={`${scoreTo100(topScore)}%`}
              icon={Trophy}
              accent="emerald"
            />
            <StatsCard
              title="Avg Score"
              value={`${scoreTo100(avgScore)}%`}
              icon={Star}
              accent="amber"
            />
            <StatsCard
              title="Vector Index"
              value={formatNumber(cacheStatus?.vectors || 0)}
              icon={Target}
              accent="sky"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <h3 className="mb-4 text-lg font-semibold text-slate-200">Top Candidates</h3>
          <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-1">
            {loading ? <SkeletonTable rows={5} /> : <TopCandidatesTable candidates={top10} />}
          </div>
        </div>

        <div>
          <h3 className="mb-4 text-lg font-semibold text-slate-200">System Status</h3>
          {loading ? (
            <div className="space-y-3">
               <SkeletonCard lines={2} />
               <SkeletonCard lines={2} />
               <SkeletonCard lines={2} />
            </div>
          ) : (
            aiStatus && cacheStatus && (
              <div className="flex flex-col gap-3">
                <AIEngineStatus aiStatus={aiStatus} cacheStatus={cacheStatus} />
              </div>
            )
          )}
        </div>
      </div>
    </AppShell>
  );
}
