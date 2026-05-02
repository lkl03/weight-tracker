"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/40 bg-white/90 backdrop-blur-md px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-slate-600 mb-1">{label}</p>
      <p className="text-blue-600 font-medium">{Number(payload[0].value).toFixed(1)} kg</p>
    </div>
  );
};

interface AverageDataPoint {
  label: string;
  avg: number;
}

interface Props {
  data: AverageDataPoint[];
  color?: string;
}

export function AveragesChart({ data, color = "#3b82f6" }: Props) {
  const values = data.map((d) => d.avg);
  const minY = values.length ? Math.floor(Math.min(...values) - 1) : 60;
  const maxY = values.length ? Math.ceil(Math.max(...values) + 1) : 90;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10, fill: "#94a3b8" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          domain={[minY, maxY]}
          tick={{ fontSize: 10, fill: "#94a3b8" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f1f5f9" }} />
        <Bar dataKey="avg" radius={[6, 6, 0, 0]} maxBarSize={40}>
          {data.map((_, i) => (
            <Cell key={i} fill={i === data.length - 1 ? color : `${color}80`} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
