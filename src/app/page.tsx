import { createServerClient, dbRowToEntry } from "@/lib/supabase";
import { computeStats, buildChartData, buildWeeklyAverages, buildMonthlyAverages } from "@/lib/calculations";
import { getAgeFromBirthdate, getDailyMotivation } from "@/lib/utils";
import { DashboardClient } from "./DashboardClient";

const BIRTH_DATE = new Date(2003, 1, 14); // Feb 14, 2003

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const db = createServerClient();
  const { data, error } = await db
    .from("weight_entries")
    .select("*")
    .order("date", { ascending: true })
    .order("time", { ascending: true });

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-red-500 text-sm">Error cargando datos: {error.message}</p>
      </div>
    );
  }

  const entries = (data ?? []).map(dbRowToEntry);
  const stats = computeStats(entries);
  const allChartData = buildChartData(entries);
  const weeklyAvgs = buildWeeklyAverages(entries);
  const monthlyAvgs = buildMonthlyAverages(entries);

  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const byDate = new Map<string, number>();
  for (const e of sorted) byDate.set(e.date, e.weightKg);
  const dates = [...byDate.keys()].sort();
  const dailyDeltas = dates.slice(1).map((date, i) => ({
    date,
    delta: Math.round((byDate.get(date)! - byDate.get(dates[i])!) * 100) / 100,
  }));

  const age = getAgeFromBirthdate(BIRTH_DATE);
  const motivation = getDailyMotivation();

  return (
    <DashboardClient
      entries={entries}
      stats={stats}
      allChartData={allChartData}
      weeklyAvgs={weeklyAvgs}
      monthlyAvgs={monthlyAvgs}
      dailyDeltas={dailyDeltas}
      age={age}
      motivation={motivation}
    />
  );
}
