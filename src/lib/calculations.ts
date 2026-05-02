import type { WeightEntry, SummaryStats, ChartDataPoint } from "@/types";

const GOAL_WEIGHT = 72;
const HEIGHT_CM = 180;

export function computeStats(entries: WeightEntry[]): SummaryStats {
  if (entries.length === 0) {
    return {
      currentWeight: null,
      previousWeight: null,
      changeVsYesterday: null,
      changeVsWeekAgo: null,
      highestWeight: null,
      highestWeightDate: null,
      lowestWeight: null,
      lowestWeightDate: null,
      avg7Days: null,
      avg30Days: null,
      daysTracked: 0,
      currentStreak: 0,
      bmi: null,
      goalWeight: GOAL_WEIGHT,
      diffFromGoal: null,
    };
  }

  const sorted = [...entries].sort((a, b) => {
    const dateCompare = b.date.localeCompare(a.date);
    if (dateCompare !== 0) return dateCompare;
    return b.time.localeCompare(a.time);
  });

  const current = sorted[0];
  const previous = sorted[1] ?? null;

  // Group by date (latest entry per day)
  const byDate = new Map<string, WeightEntry>();
  for (const e of sorted) {
    if (!byDate.has(e.date)) byDate.set(e.date, e);
  }

  const sortedDates = [...byDate.keys()].sort((a, b) => b.localeCompare(a));
  const currentWeight = byDate.get(sortedDates[0])?.weightKg ?? null;
  const previousWeight = byDate.get(sortedDates[1])?.weightKg ?? null;

  // Week ago
  const weekAgoDate = new Date(sortedDates[0]);
  weekAgoDate.setDate(weekAgoDate.getDate() - 7);
  const weekAgoStr = weekAgoDate.toISOString().split("T")[0];
  const weekAgoEntry = [...byDate.entries()]
    .filter(([d]) => d <= weekAgoStr)
    .sort(([a], [b]) => b.localeCompare(a))[0];
  const weekAgoWeight = weekAgoEntry ? weekAgoEntry[1].weightKg : null;

  // Highest / Lowest
  const weights = [...byDate.values()];
  const highest = weights.reduce((max, e) => (e.weightKg > max.weightKg ? e : max));
  const lowest = weights.reduce((min, e) => (e.weightKg < min.weightKg ? e : min));

  // Averages
  const now = new Date();
  const d7 = new Date(now); d7.setDate(d7.getDate() - 7);
  const d30 = new Date(now); d30.setDate(d30.getDate() - 30);
  const d7Str = d7.toISOString().split("T")[0];
  const d30Str = d30.toISOString().split("T")[0];

  const last7 = weights.filter((e) => e.date >= d7Str);
  const last30 = weights.filter((e) => e.date >= d30Str);
  const avg7 = last7.length > 0 ? last7.reduce((s, e) => s + e.weightKg, 0) / last7.length : null;
  const avg30 = last30.length > 0 ? last30.reduce((s, e) => s + e.weightKg, 0) / last30.length : null;

  // Streak
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    if (byDate.has(dateStr)) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }

  const bmi = currentWeight ? Number((currentWeight / Math.pow(HEIGHT_CM / 100, 2)).toFixed(1)) : null;

  return {
    currentWeight,
    previousWeight,
    changeVsYesterday: currentWeight !== null && previousWeight !== null ? round2(currentWeight - previousWeight) : null,
    changeVsWeekAgo: currentWeight !== null && weekAgoWeight !== null ? round2(currentWeight - weekAgoWeight) : null,
    highestWeight: highest.weightKg,
    highestWeightDate: highest.date,
    lowestWeight: lowest.weightKg,
    lowestWeightDate: lowest.date,
    avg7Days: avg7 !== null ? round2(avg7) : null,
    avg30Days: avg30 !== null ? round2(avg30) : null,
    daysTracked: byDate.size,
    currentStreak: streak,
    bmi,
    goalWeight: GOAL_WEIGHT,
    diffFromGoal: currentWeight !== null ? round2(currentWeight - GOAL_WEIGHT) : null,
  };
}

export function buildChartData(entries: WeightEntry[], windowDays?: number): ChartDataPoint[] {
  // Latest entry per day
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const byDate = new Map<string, number>();
  for (const e of sorted) {
    byDate.set(e.date, e.weightKg);
  }

  let dates = [...byDate.keys()].sort();
  if (windowDays) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - windowDays);
    const cutoffStr = cutoff.toISOString().split("T")[0];
    dates = dates.filter((d) => d >= cutoffStr);
  }

  return dates.map((date, idx, arr) => {
    const weight = byDate.get(date) ?? null;

    // 7-day moving average
    const slice7 = arr.slice(Math.max(0, idx - 6), idx + 1).map((d) => byDate.get(d)).filter((v): v is number => v !== undefined);
    const ma7 = slice7.length > 0 ? round2(slice7.reduce((a, b) => a + b, 0) / slice7.length) : null;

    // 30-day moving average
    const slice30 = arr.slice(Math.max(0, idx - 29), idx + 1).map((d) => byDate.get(d)).filter((v): v is number => v !== undefined);
    const ma30 = slice30.length > 0 ? round2(slice30.reduce((a, b) => a + b, 0) / slice30.length) : null;

    return { date, weight, ma7, ma30 };
  });
}

export function buildWeeklyAverages(entries: WeightEntry[]): { week: string; avg: number }[] {
  const byWeek = new Map<string, number[]>();
  for (const e of entries) {
    const d = new Date(e.date + "T12:00:00");
    const monday = new Date(d);
    monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    const weekKey = monday.toISOString().split("T")[0];
    if (!byWeek.has(weekKey)) byWeek.set(weekKey, []);
    byWeek.get(weekKey)!.push(e.weightKg);
  }
  return [...byWeek.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, vals]) => ({ week, avg: round2(vals.reduce((a, b) => a + b, 0) / vals.length) }));
}

export function buildMonthlyAverages(entries: WeightEntry[]): { month: string; avg: number }[] {
  const byMonth = new Map<string, number[]>();
  for (const e of entries) {
    const month = e.date.slice(0, 7);
    if (!byMonth.has(month)) byMonth.set(month, []);
    byMonth.get(month)!.push(e.weightKg);
  }
  return [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, vals]) => ({ month, avg: round2(vals.reduce((a, b) => a + b, 0) / vals.length) }));
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
