"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Cell,
} from "recharts";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const val = Number(payload[0].value);
  return (
    <div className="rounded-xl border border-white/40 bg-white/90 backdrop-blur-md px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-slate-600 mb-1">{label}</p>
      <p className={`font-medium ${val < 0 ? "text-emerald-600" : val > 0 ? "text-rose-500" : "text-slate-500"}`}>
        {val > 0 ? "+" : ""}{val.toFixed(2)} kg
      </p>
    </div>
  );
};

interface Props {
  data: { date: string; delta: number }[];
}

export function DailyDeltaChart({ data }: Props) {
  const tickCount = Math.min(data.length, 8);
  const step = Math.ceil(data.length / tickCount);
  const ticks = data.filter((_, i) => i % step === 0).map((d) => d.date);

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis
          dataKey="date"
          ticks={ticks}
          tickFormatter={(d) => {
            const dt = new Date(d + "T12:00:00");
            return dt.toLocaleDateString("es-AR", { day: "numeric", month: "short" });
          }}
          tick={{ fontSize: 10, fill: "#94a3b8" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f1f5f9" }} />
        <ReferenceLine y={0} stroke="#cbd5e1" />
        <Bar dataKey="delta" radius={[3, 3, 0, 0]} maxBarSize={12}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.delta <= 0 ? "#10b981" : "#f43f5e"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
