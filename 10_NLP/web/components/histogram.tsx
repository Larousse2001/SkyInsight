"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export function Histogram({
  data,
}: {
  data: { bin: string; count: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="histGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.7} />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#252836" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="bin" stroke="#8b8fa3" fontSize={11} tickLine={false} axisLine={false} />
        <YAxis stroke="#8b8fa3" fontSize={12} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{
            background: "#11121a",
            border: "1px solid #252836",
            borderRadius: 8,
            fontSize: 12,
          }}
        />
        <Area
          type="monotone"
          dataKey="count"
          stroke="#22d3ee"
          strokeWidth={2}
          fill="url(#histGrad)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
