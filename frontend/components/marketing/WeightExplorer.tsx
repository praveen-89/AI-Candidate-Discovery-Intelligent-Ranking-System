"use client";

import { useMemo, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { RotateCcw } from "lucide-react";
import { SCORE_FACTORS } from "@/lib/marketing/factors";

// A real sub-score profile, taken from an actual test run of the scoring
// engine (ai_engine/src/core/score_single.py) against a sample resume —
// not fabricated numbers.
const SAMPLE_SUB_SCORES: Record<string, number> = {
  semantic: 0.8674,
  skill: 1.0,
  experience: 1.0,
  career: 0.8082,
  behavioral: 0.2,
  education: 0.3,
  availability: 1.0,
  location: 0.5,
};

/**
 * Interactive weight explorer: 8 sliders, defaulting to the real model
 * weights. A sample candidate's final score and factor-contribution donut
 * update live as weights change.
 */
export function WeightExplorer() {
  const defaults = useMemo(
    () => Object.fromEntries(SCORE_FACTORS.map((f) => [f.key, f.weight])),
    []
  );
  const [weights, setWeights] = useState<Record<string, number>>(defaults);

  const total = Object.values(weights).reduce((a, b) => a + b, 0) || 1;
  const normalized = Object.fromEntries(
    Object.entries(weights).map(([k, v]) => [k, v / total])
  );
  const finalScore = SCORE_FACTORS.reduce(
    (sum, f) => sum + normalized[f.key] * SAMPLE_SUB_SCORES[f.key],
    0
  );

  const pieData = SCORE_FACTORS.map((f) => ({
    name: f.label,
    value: normalized[f.key] * SAMPLE_SUB_SCORES[f.key],
    color: f.color,
  }));

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-5">
      <div className="lg:col-span-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-mkt-text-secondary">
            Adjust the weights
          </p>
          <button
            onClick={() => setWeights(defaults)}
            className="flex items-center gap-1.5 text-xs text-mkt-text-secondary transition hover:text-mkt-text"
          >
            <RotateCcw className="h-3 w-3" />
            Reset to defaults
          </button>
        </div>

        <div className="mt-5 space-y-5">
          {SCORE_FACTORS.map((f) => (
            <div key={f.key}>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-mkt-text">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: f.color }} />
                  {f.label}
                </span>
                <span className="font-mono text-mkt-text-secondary">
                  {Math.round(normalized[f.key] * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={0.5}
                step={0.01}
                value={weights[f.key]}
                onChange={(e) => setWeights((w) => ({ ...w, [f.key]: Number(e.target.value) }))}
                className="mt-2 w-full accent-[var(--mkt-accent)]"
                aria-label={`${f.label} weight`}
              />
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-mkt-text-secondary">
          Weights are normalized to sum to 100% here for clarity. In production
          they're set via environment variables (<code className="font-mono">WEIGHT_SEMANTIC</code>,{" "}
          <code className="font-mono">WEIGHT_SKILL</code>, etc.) and the ranker
          normalizes them the same way if they don't already sum to 1.0.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center lg:col-span-2">
        <div className="relative h-56 w-56">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                innerRadius={65}
                outerRadius={95}
                paddingAngle={2}
                startAngle={90}
                endAngle={-270}
                isAnimationActive
              >
                {pieData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => [`${(Number(value) * 100).toFixed(1)}%`, name]}
                contentStyle={{
                  backgroundColor: "var(--mkt-surface)",
                  borderColor: "var(--mkt-border)",
                  borderRadius: "0.5rem",
                  color: "var(--mkt-text)",
                  fontSize: "12px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <p className="font-mono text-3xl font-semibold tabular-nums text-mkt-text">
              {finalScore.toFixed(2)}
            </p>
            <p className="text-[11px] text-mkt-text-secondary">final score</p>
          </div>
        </div>
        <p className="mt-4 font-mono text-xs text-mkt-text-secondary">CAND_0046064 (sample)</p>
      </div>
    </div>
  );
}
