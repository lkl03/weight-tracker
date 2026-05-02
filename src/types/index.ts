export type WeightEntry = {
  id: string;
  date: string; // YYYY-MM-DD (America/Argentina/Buenos_Aires)
  time: string; // HH:mm
  weightKg: number;
  notes?: string | null;
  source: "telegram" | "manual" | "auto-filled" | "import";
  createdAt: string;
  updatedAt?: string | null;
};

export type WeightEntryInsert = Omit<WeightEntry, "id" | "createdAt" | "updatedAt"> & {
  id?: string;
  createdAt?: string;
};

export type SummaryStats = {
  currentWeight: number | null;
  previousWeight: number | null;
  changeVsYesterday: number | null;
  changeVsWeekAgo: number | null;
  highestWeight: number | null;
  highestWeightDate: string | null;
  lowestWeight: number | null;
  lowestWeightDate: string | null;
  avg7Days: number | null;
  avg30Days: number | null;
  daysTracked: number;
  currentStreak: number;
  bmi: number | null;
  goalWeight: number;
  diffFromGoal: number | null;
};

export type ChartDataPoint = {
  date: string;
  weight: number | null;
  ma7: number | null;
  ma30: number | null;
};

export type PeriodFilter = "7d" | "30d" | "90d" | "1y" | "all";
