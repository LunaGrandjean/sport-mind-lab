import {
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import { RADAR_MAX_SCORE } from "@/lib/scoring";

export interface RadarDatum {
  axis: string;
  athlete: number | null;
  group: number | null;
}

export function RadarPerformance({
  data,
  athleteName,
  groupLabel,
}: {
  data: RadarDatum[];
  athleteName: string;
  groupLabel: string;
}) {
  return (
    <div className="mx-auto w-full max-w-[720px] rounded-lg border border-cyan-100 bg-white p-3">
      <div className="mb-2 flex flex-wrap justify-center gap-2 text-[11px] font-medium">
        <span className="rounded-full bg-red-100 px-2 py-1 text-red-700">
          &lt; 8 rouge
        </span>
        <span className="rounded-full bg-amber-100 px-2 py-1 text-amber-700">
          8 à 12 orange
        </span>
        <span className="rounded-full bg-green-100 px-2 py-1 text-green-700">
          &gt; 12 vert
        </span>
      </div>
      <div className="relative h-[400px] w-full">
        <div className="radar-score-zones pointer-events-none absolute left-1/2 top-[46%] z-0 aspect-square h-[72%] -translate-x-1/2 -translate-y-1/2 rounded-full" />
        <div className="relative z-10 h-full w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={data} outerRadius="72%">
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis
                dataKey="axis"
                tick={{ fill: "#b39b00", fontSize: 11, fontWeight: 600 }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, RADAR_MAX_SCORE]}
                tick={{ fill: "#6b4b4b", fontSize: 10 }}
                axisLine={false}
              />
              <Radar
                name={groupLabel}
                dataKey="group"
                stroke="var(--chart-3)"
                fill="var(--chart-3)"
                fillOpacity={0.15}
              />
              <Radar
                name={athleteName}
                dataKey="athlete"
                stroke="var(--primary)"
                fill="var(--primary)"
                fillOpacity={0.25}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
