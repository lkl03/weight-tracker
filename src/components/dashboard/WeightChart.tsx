"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from "recharts";
import type { ChartDataPoint } from "@/types";

function formatXAxis(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("es-AR", { day: "numeric", month: "short" });
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/40 bg-white/90 backdrop-blur-md px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-slate-600 mb-1">{formatXAxis(label)}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="font-medium">
          {p.name}: {p.value !== null ? `${Number(p.value).toFixed(1)} kg` : "—"}
        </p>
      ))}
    </div>
  );
};

// Custom label rendered inside the chart for year markers
const YearLabel = ({ viewBox, year }: { viewBox?: { x: number; y: number; height: number }; year: string }) => {
  if (!viewBox) return null;
  const { x, y, height } = viewBox;
  return (
    <g>
      <rect x={x + 3} y={y + (height ?? 0) - 22} width={32} height={16} rx={4} fill="#f1f5f9" opacity={0.9} />
      <text
        x={x + 19}
        y={y + (height ?? 0) - 10}
        textAnchor="middle"
        fontSize={10}
        fontWeight={600}
        fill="#64748b"
      >
        {year}
      </text>
    </g>
  );
};

interface Props {
  data: ChartDataPoint[];
  showMA7?: boolean;
  showMA30?: boolean;
  goalWeight?: number;
}

export function WeightChart({ data, showMA7 = true, showMA30 = false, goalWeight }: Props) {
  const weights = data.map((d) => d.weight).filter((w): w is number => w !== null);
  const minY = weights.length ? Math.floor(Math.min(...weights) - 1) : 60;
  const maxY = weights.length ? Math.ceil(Math.max(...weights) + 1) : 90;

  // Thin out X-axis labels for dense data
  const tickCount = Math.min(data.length, 8);
  const step = Math.ceil(data.length / tickCount);
  const ticks = data.filter((_, i) => i % step === 0).map((d) => d.date);

  // Find year-boundary dates: the first data point of each year after the first
  const yearBoundaries: { date: string; year: string }[] = [];
  let lastYear = "";
  for (const point of data) {
    const year = point.date.slice(0, 4);
    if (year !== lastYear) {
      if (lastYear !== "") {
        yearBoundaries.push({ date: point.date, year });
      }
      lastYear = year;
    }
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis
          dataKey="date"
          ticks={ticks}
          tickFormatter={formatXAxis}
          tick={{ fontSize: 11, fill: "#94a3b8" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          domain={[minY, maxY]}
          tick={{ fontSize: 11, fill: "#94a3b8" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${v}`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
          iconType="circle"
          iconSize={8}
        />

        {/* Goal weight line */}
        {goalWeight != null && goalWeight > 0 && (
          <ReferenceLine
            y={goalWeight}
            stroke="#f87171"
            strokeDasharray="5 5"
            strokeWidth={1.5}
            label={{ value: `Meta ${goalWeight}`, position: "right", fontSize: 10, fill: "#f87171" }}
          />
        )}

        {/* Year boundary markers — only shown when data spans multiple years */}
        {yearBoundaries.map(({ date, year }) => (
          <ReferenceLine
            key={year}
            x={date}
            stroke="#94a3b8"
            strokeDasharray="4 3"
            strokeWidth={1}
            label={<YearLabel year={year} />}
          />
        ))}

        <Line
          type="monotone"
          dataKey="weight"
          name="Peso"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={data.length < 60 ? { r: 2.5, fill: "#3b82f6" } : false}
          activeDot={{ r: 5 }}
          connectNulls={false}
        />
        {showMA7 && (
          <Line
            type="monotone"
            dataKey="ma7"
            name="Media 7d"
            stroke="#8b5cf6"
            strokeWidth={1.5}
            dot={false}
            strokeDasharray="4 2"
          />
        )}
        {showMA30 && (
          <Line
            type="monotone"
            dataKey="ma30"
            name="Media 30d"
            stroke="#f59e0b"
            strokeWidth={1.5}
            dot={false}
            strokeDasharray="6 3"
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}
