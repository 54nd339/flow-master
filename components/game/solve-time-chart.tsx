"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface ChartDataPoint {
  index: number
  time: number
  size: string
  stars: number
}

export function SolveTimeChart({ data }: { data: ChartDataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
        <defs>
          <linearGradient id="solveTimeGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis
          dataKey="index"
          tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => `${v}s`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "var(--background)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            fontSize: "12px",
            color: "var(--foreground)",
          }}
          formatter={(value) => [`${value}s`, "Solve Time"]}
          labelFormatter={(label) => `Puzzle #${label}`}
        />
        <Area
          type="monotone"
          dataKey="time"
          stroke="var(--accent)"
          fill="url(#solveTimeGradient)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
