"use client";

import { AppShell } from "@/components/layout/AppShell";
import { FileText, Lock, Info } from "lucide-react";
import Link from "next/link";

export default function JobsPage() {
  return (
    <AppShell pageTitle="Jobs">
      <div className="mx-auto max-w-4xl pt-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-100">Job Profile Management</h2>
          <p className="mt-1 text-sm text-slate-400">
            View the currently active job description used by the AI engine.
          </p>
        </div>

        <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-4 mb-8 flex gap-3">
          <Info className="h-5 w-5 text-blue-400 shrink-0" />
          <div>
            <h4 className="text-sm font-semibold text-blue-200">Backend Managed Document</h4>
            <p className="text-xs text-blue-300/80 mt-1">
              The job description is currently managed directly by the backend engine via <code className="bg-blue-950/50 px-1 py-0.5 rounded text-blue-200">datasets/raw/job_description.docx</code>. 
              Uploading or editing job descriptions through the UI is disabled in this environment to maintain dataset integrity.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-700/50 bg-slate-800/40 p-8 shadow-lg text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-700/50">
            <FileText className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-200">job_description.docx</h3>
          <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto mb-6">
            This document serves as the ground-truth semantic anchor for all candidate similarity scoring and skill extraction.
          </p>
          
          <div className="flex items-center justify-center gap-2 text-xs text-slate-400 bg-slate-900/50 inline-flex px-4 py-2 rounded-lg border border-slate-700/50 mx-auto">
            <Lock className="h-3.5 w-3.5" />
            Read-only mode
          </div>

          <div className="mt-10 border-t border-slate-700/50 pt-8">
            <Link 
              href="/ranking"
              className="inline-flex items-center justify-center rounded-lg bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500"
            >
              Go to AI Ranking
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
