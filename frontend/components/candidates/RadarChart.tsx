"use client";

import { useMemo } from "react";
import {
  Radar,
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { SubScores } from "@/types/candidate";
import { SUB_SCORE_LABELS, scoreTo100 } from "@/lib/utils/format";

interface RadarChartProps {
  subScores: SubScores;
}

export function RadarChart({ subScores }: RadarChartProps) {
  const data = useMemo(() => {
    return Object.entries(subScores).map(([key, val]) => ({
      subject: SUB_SCORE_LABELS[key] || key,
      A: scoreTo100(val),
      fullMark: 100,
    }));
  }, [subScores]);

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsRadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="#334155" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: "#94a3b8", fontSize: 11 }}
          />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
          <Radar
            name="Score"
            dataKey="A"
            stroke="#3573e6"
            fill="#3573e6"
            fillOpacity={0.35}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(15, 23, 42, 0.9)",
              borderColor: "rgba(51, 65, 85, 0.5)",
              borderRadius: "0.5rem",
              color: "#f1f5f9",
            }}
            itemStyle={{ color: "#5b9bf5" }}
            formatter={(value: any) => [`${value}%`, "Score"]}
          />
        </RechartsRadarChart>
      </ResponsiveContainer>
    </div>
  );
}
