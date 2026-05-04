"use client";

import { useState, useMemo, useEffect } from "react";
import type { WeightEntry, SummaryStats, ChartDataPoint, PeriodFilter } from "@/types";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { WeightChart } from "@/components/dashboard/WeightChart";
import { AveragesChart } from "@/components/dashboard/AveragesChart";
import { DailyDeltaChart } from "@/components/dashboard/DailyDeltaChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildChartData } from "@/lib/calculations";
import { Sparkles } from "lucide-react";

interface WeeklyAvg { week: string; avg: number }
interface MonthlyAvg { month: string; avg: number }

interface Props {
  entries: WeightEntry[];
  stats: SummaryStats;
  allChartData: ChartDataPoint[];
  weeklyAvgs: WeeklyAvg[];
  monthlyAvgs: MonthlyAvg[];
  dailyDeltas: { date: string; delta: number }[];
  age: { years: number; days: number };
  motivation: string;
}

const PERIOD_OPTIONS: { value: PeriodFilter; label: string }[] = [
  { value: "7d", label: "7 días" },
  { value: "30d", label: "30 días" },
  { value: "90d", label: "3 meses" },
  { value: "1y", label: "1 año" },
  { value: "all", label: "Todo" },
];

const periodToDays: Record<PeriodFilter, number | undefined> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  "1y": 365,
  "all": undefined,
};

const DEFAULT_GOAL = 72;

export function DashboardClient({
  entries,
  stats,
  allChartData,
  weeklyAvgs,
  monthlyAvgs,
  dailyDeltas,
  age,
  motivation,
}: Props) {
  const [period, setPeriod] = useState<PeriodFilter>("90d");
  const [showMA30, setShowMA30] = useState(false);

  // Client-side dynamic values
  const [greeting, setGreeting] = useState("Buen día");
  const [todayStr, setTodayStr] = useState("");
  const [goalWeight, setGoalWeight] = useState(DEFAULT_GOAL);

  useEffect(() => {
    // Greeting based on Buenos Aires time
    const hourStr = new Date().toLocaleString("es-AR", {
      timeZone: "America/Argentina/Buenos_Aires",
      hour: "numeric",
      hour12: false,
    });
    const hour = parseInt(hourStr, 10);
    setGreeting(hour < 18 ? "Buen día" : "Buenas noches");

    // Today's date formatted in Spanish
    const raw = new Date().toLocaleDateString("es-AR", {
      timeZone: "America/Argentina/Buenos_Aires",
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    setTodayStr(raw.charAt(0).toUpperCase() + raw.slice(1));

    // Goal weight from localStorage
    const saved = localStorage.getItem("goalWeight");
    if (saved) {
      const parsed = parseFloat(saved);
      if (!isNaN(parsed) && parsed > 0) setGoalWeight(parsed);
    }
  }, []);

  function handleGoalChange(newGoal: number) {
    setGoalWeight(newGoal);
    localStorage.setItem("goalWeight", String(newGoal));
  }

  // Override goal-related stats with client-side editable goal
  const effectiveStats: SummaryStats = useMemo(() => ({
    ...stats,
    goalWeight,
    diffFromGoal: stats.currentWeight !== null
      ? Math.round((stats.currentWeight - goalWeight) * 100) / 100
      : null,
  }), [stats, goalWeight]);

  const chartData = useMemo(() => {
    const days = periodToDays[period];
    return days ? buildChartData(entries, days) : allChartData;
  }, [period, entries, allChartData]);

  const filteredDeltas = useMemo(() => {
    const days = periodToDays[period];
    if (!days) return dailyDeltas;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().split("T")[0];
    return dailyDeltas.filter((d) => d.date >= cutoffStr);
  }, [period, dailyDeltas]);

  const shownWeeklyAvgs = weeklyAvgs.slice(-12).map((w) => ({
    label: w.week.slice(5),
    avg: w.avg,
  }));

  const shownMonthlyAvgs = monthlyAvgs.map((m) => ({
    label: new Date(m.month + "-01").toLocaleDateString("es-AR", { month: "short", year: "2-digit" }),
    avg: m.avg,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {greeting}, <span className="text-blue-600">Luca</span> 👋
          </h1>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <p className="text-sm text-slate-500">
              {age.years} años y {age.days} días
            </p>
            {todayStr && (
              <>
                <span className="text-slate-300 text-sm">·</span>
                <p className="text-sm text-slate-500">{todayStr}</p>
              </>
            )}
          </div>
        </div>
        <div className="flex items-start gap-2 rounded-2xl border border-amber-200/60 bg-amber-50/70 px-4 py-2.5 backdrop-blur-sm max-w-sm">
          <Sparkles size={15} className="text-amber-500 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-800 leading-snug">{motivation}</p>
        </div>
      </div>

      {/* Summary cards */}
      <SummaryCards stats={effectiveStats} onGoalChange={handleGoalChange} />

      {/* Period toggle */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-slate-400 font-medium">Vista:</span>
        <div className="flex rounded-xl border border-slate-200 bg-white/70 p-0.5 gap-0.5">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPeriod(opt.value)}
              className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                period === opt.value
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer ml-2">
          <input
            type="checkbox"
            className="rounded"
            checked={showMA30}
            onChange={(e) => setShowMA30(e.target.checked)}
          />
          Media 30d
        </label>
      </div>

      {/* Main weight chart */}
      <Card>
        <CardHeader>
          <CardTitle>Evolución del peso</CardTitle>
        </CardHeader>
        <CardContent>
          <WeightChart
            data={chartData}
            showMA7={true}
            showMA30={showMA30}
            goalWeight={goalWeight}
          />
        </CardContent>
      </Card>

      {/* Averages + Daily delta */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Promedio semanal</CardTitle>
          </CardHeader>
          <CardContent>
            <AveragesChart data={shownWeeklyAvgs} color="#3b82f6" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Promedio mensual</CardTitle>
          </CardHeader>
          <CardContent>
            <AveragesChart data={shownMonthlyAvgs} color="#8b5cf6" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Variación diaria</CardTitle>
          </CardHeader>
          <CardContent>
            <DailyDeltaChart data={filteredDeltas} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
