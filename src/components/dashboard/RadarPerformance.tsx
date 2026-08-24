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
    <div className="h-[460px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="72%">
          <PolarGrid stroke="var(--border)" />
          <PolarAngleAxis
            dataKey="axis"
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
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
  );
}
