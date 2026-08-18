"use client";

import { AppShell } from "@/components/layout/AppShell";
import { RunRankingButton } from "@/components/ranking/RunRankingButton";
import { BrainCircuit, Cpu, Database } from "lucide-react";

export default function RankingPage() {
  return (
    <AppShell pageTitle="Ranking">
      <div className="mx-auto max-w-4xl pt-8">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-600/20 shadow-xl shadow-violet-500/5 border border-violet-500/20">
            <BrainCircuit className="h-10 w-10 text-violet-400" />
          </div>
          <h2 className="mb-3 text-3xl font-bold text-slate-100">AI Ranking Engine</h2>
          <p className="mx-auto max-w-xl text-slate-400">
            Trigger the inference pipeline to score and rank candidates against the active job description using BAAI/bge-small-en-v1.5 embeddings and FAISS similarity search.
          </p>
        </div>

        <div className="mb-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-5 text-center">
            <Cpu className="mx-auto mb-3 h-6 w-6 text-slate-500" />
            <h3 className="mb-1 text-sm font-semibold text-slate-200">1. Hybrid Retrieval</h3>
            <p className="text-xs text-slate-400">Semantic vector search combined with keyword filtering.</p>
          </div>
          <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-5 text-center">
            <BrainCircuit className="mx-auto mb-3 h-6 w-6 text-slate-500" />
            <h3 className="mb-1 text-sm font-semibold text-slate-200">2. Multi-dimensional Scoring</h3>
            <p className="text-xs text-slate-400">Evaluation across 8 unique professional dimensions.</p>
          </div>
          <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-5 text-center sm:col-span-2 lg:col-span-1">
            <Database className="mx-auto mb-3 h-6 w-6 text-slate-500" />
            <h3 className="mb-1 text-sm font-semibold text-slate-200">3. JSON Generation</h3>
            <p className="text-xs text-slate-400">Automated submission and manifest payload creation.</p>
          </div>
        </div>

        <div className="flex justify-center border-t border-slate-700/50 pt-12">
          <RunRankingButton />
        </div>
      </div>
    </AppShell>
  );
}
