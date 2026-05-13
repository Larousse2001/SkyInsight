"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
} from "recharts";

const COLORS: Record<string, string> = {
  positive: "#10b981",
  POSITIVE: "#10b981",
  negative: "#ef4444",
  NEGATIVE: "#ef4444",
  neutral: "#f59e0b",
};

export function SentimentBar({
  data,
  labelKey = "label",
}: {
  data: { label?: string; topic_id?: number; count: number }[];
  labelKey?: "label" | "topic_id";
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid stroke="#252836" strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey={labelKey}
          stroke="#8b8fa3"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis stroke="#8b8fa3" fontSize={12} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{
            background: "#11121a",
            border: "1px solid #252836",
            borderRadius: 8,
            fontSize: 12,
          }}
          cursor={{ fill: "rgba(255,255,255,0.04)" }}
        />
        <Bar dataKey="count" radius={[6, 6, 0, 0]}>
          {data.map((d, i) => (
            <Cell
              key={i}
              fill={
                labelKey === "label"
                  ? COLORS[(d as any).label] ?? "#6366f1"
                  : "#6366f1"
              }
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
