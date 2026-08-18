"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { SystemStatusCard, SystemStatusRow } from "@/components/system/SystemStatusCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { ErrorState } from "@/components/ui/ErrorState";
import { Activity, ShieldCheck, Database, Brain, FileJson } from "lucide-react";
import { getHealth, getVersion } from "@/lib/api/health";
import { getAIStatus, getCacheStatus } from "@/lib/api/system";
import { getManifest } from "@/lib/api/ranking";
import { formatNumber, formatTimestamp, formatLatency } from "@/lib/utils/format";
import type { HealthResponse, VersionResponse, CacheStatusResponse, AIStatusResponse } from "@/types/system";
import type { ManifestData } from "@/types/ranking";

export default function SystemPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [version, setVersion] = useState<VersionResponse | null>(null);
  const [aiStatus, setAiStatus] = useState<AIStatusResponse | null>(null);
  const [cacheStatus, setCacheStatus] = useState<CacheStatusResponse | null>(null);
  const [manifest, setManifest] = useState<ManifestData | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [h, v, ai, cache, man] = await Promise.all([
        getHealth().catch(() => ({ status: "offline", message: "API Offline" })),
        getVersion().catch(() => null),
        getAIStatus().catch(() => null),
        getCacheStatus().catch(() => null),
        getManifest().catch(() => null),
      ]);
      setHealth(h);
      setVersion(v);
      setAiStatus(ai);
      setCacheStatus(cache);
      setManifest(man);
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
      <AppShell pageTitle="System Status">
        <ErrorState error={error} onRetry={loadData} />
      </AppShell>
    );
  }

  return (
    <AppShell pageTitle="System Status">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-100">System Monitoring</h2>
        <p className="mt-1 text-sm text-slate-400">
          Live diagnostic information for the FastAPI backend and AI Engine.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {/* Core API */}
        {loading ? <SkeletonCard lines={4} /> : (
          <SystemStatusCard title="Core API" icon={Activity}>
            <SystemStatusRow label="Status" value={<StatusBadge status={health?.status || "offline"} />} />
            <SystemStatusRow label="Project" value={version?.project || "—"} />
            <SystemStatusRow label="Version" value={version?.version || "—"} />
            <SystemStatusRow label="Environment" value={version?.environment || "—"} />
          </SystemStatusCard>
        )}

        {/* AI Engine */}
        {loading ? <SkeletonCard lines={4} /> : (
          <SystemStatusCard title="AI Engine" icon={Brain}>
            <SystemStatusRow label="Engine State" value={<StatusBadge status={aiStatus?.engine || "offline"} />} />
            <SystemStatusRow label="Cache State" value={<StatusBadge status={aiStatus?.cache || "offline"} />} />
            <SystemStatusRow label="Vector Count" value={formatNumber(aiStatus?.vectors || 0)} />
          </SystemStatusCard>
        )}

        {/* FAISS Cache */}
        {loading ? <SkeletonCard lines={4} /> : (
          <SystemStatusCard title="FAISS Datastore" icon={Database}>
            <SystemStatusRow label="Index Valid" value={cacheStatus?.cache ? "Yes" : "No"} />
            <SystemStatusRow label="Total Vectors" value={formatNumber(cacheStatus?.vectors || 0)} />
            <SystemStatusRow label="Dataset" value={<span className="font-mono text-xs">{cacheStatus?.dataset || "—"}</span>} />
            <SystemStatusRow label="Model" value={<span className="font-mono text-xs text-sky-400">{cacheStatus?.model || "—"}</span>} />
          </SystemStatusCard>
        )}

        {/* Manifest */}
        {loading ? <SkeletonCard lines={4} /> : (
          <div className="lg:col-span-2 xl:col-span-3">
            <SystemStatusCard title="Last Ranking Manifest" icon={FileJson}>
              {manifest ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Run Timestamp</p>
                    <p className="text-sm font-medium text-slate-200">{formatTimestamp(manifest.run_timestamp_utc)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Processed Candidates</p>
                    <p className="text-sm font-medium text-slate-200">{formatNumber(manifest.total_candidates_processed)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Latency</p>
                    <p className="text-sm font-medium text-slate-200">{formatLatency(manifest.end_to_end_latency_seconds)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Model Config</p>
                    <p className="text-sm font-mono text-slate-400 truncate">{manifest.model_used}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500 py-4">No manifest available. Run the AI ranking pipeline first.</p>
              )}
            </SystemStatusCard>
          </div>
        )}
      </div>
    </AppShell>
  );
}
