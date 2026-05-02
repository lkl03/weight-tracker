"use client";

import { Card, CardContent, CardTitle, CardHeader } from "@/components/ui/card";
import type { SummaryStats } from "@/types";
import { formatDate, formatWeight } from "@/lib/utils";
import { TrendingDown, TrendingUp, Minus, Target, Activity, Flame, Scale, Calendar } from "lucide-react";

function DeltaBadge({ value }: { value: number | null }) {
  if (value === null) return <span className="text-slate-400 text-sm">—</span>;
  if (value === 0) return (
    <span className="inline-flex items-center gap-0.5 text-sm font-medium text-slate-500">
      <Minus size={14} /> 0.0 kg
    </span>
  );
  if (value < 0) return (
    <span className="inline-flex items-center gap-0.5 text-sm font-semibold text-emerald-600">
      <TrendingDown size={14} /> {value.toFixed(1)} kg
    </span>
  );
  return (
    <span className="inline-flex items-center gap-0.5 text-sm font-semibold text-rose-500">
      <TrendingUp size={14} /> +{value.toFixed(1)} kg
    </span>
  );
}

function bmiCategory(bmi: number): { label: string; color: string } {
  if (bmi < 18.5) return { label: "Bajo peso", color: "text-blue-600" };
  if (bmi < 25) return { label: "Normal", color: "text-emerald-600" };
  if (bmi < 30) return { label: "Sobrepeso", color: "text-amber-600" };
  return { label: "Obesidad", color: "text-rose-600" };
}

interface Props {
  stats: SummaryStats;
}

export function SummaryCards({ stats }: Props) {
  const bmi = stats.bmi;
  const bmiInfo = bmi ? bmiCategory(bmi) : null;

  const cards = [
    {
      title: "Peso actual",
      value: stats.currentWeight ? formatWeight(stats.currentWeight) : "—",
      sub: <DeltaBadge value={stats.changeVsYesterday} />,
      subLabel: "vs ayer",
      icon: <Scale size={18} className="text-blue-500" />,
      accent: "from-blue-50 to-blue-100/50",
    },
    {
      title: "Vs semana anterior",
      value: stats.changeVsWeekAgo !== null ? (stats.changeVsWeekAgo > 0 ? `+${stats.changeVsWeekAgo.toFixed(1)}` : `${stats.changeVsWeekAgo.toFixed(1)}`) + " kg" : "—",
      sub: stats.previousWeight ? <span className="text-slate-400 text-sm">{formatWeight(stats.previousWeight)} anterior</span> : null,
      subLabel: "",
      icon: <Activity size={18} className="text-violet-500" />,
      accent: "from-violet-50 to-violet-100/50",
    },
    {
      title: "Objetivo",
      value: stats.diffFromGoal !== null
        ? stats.diffFromGoal === 0 ? "🎯 ¡Logrado!"
          : stats.diffFromGoal > 0
            ? `${stats.diffFromGoal.toFixed(1)} kg para llegar`
            : `${Math.abs(stats.diffFromGoal).toFixed(1)} kg por debajo`
        : "—",
      sub: <span className="text-slate-400 text-sm">{formatWeight(stats.goalWeight)} meta</span>,
      subLabel: "",
      icon: <Target size={18} className="text-rose-500" />,
      accent: "from-rose-50 to-rose-100/50",
    },
    {
      title: "BMI",
      value: bmi ? bmi.toFixed(1) : "—",
      sub: bmiInfo ? <span className={`text-sm font-medium ${bmiInfo.color}`}>{bmiInfo.label}</span> : null,
      subLabel: "180 cm",
      icon: <Activity size={18} className="text-teal-500" />,
      accent: "from-teal-50 to-teal-100/50",
    },
    {
      title: "Promedio 7 días",
      value: stats.avg7Days ? formatWeight(stats.avg7Days) : "—",
      sub: null,
      subLabel: "últimos 7 días",
      icon: null,
      accent: "from-slate-50 to-slate-100/50",
    },
    {
      title: "Promedio 30 días",
      value: stats.avg30Days ? formatWeight(stats.avg30Days) : "—",
      sub: null,
      subLabel: "últimos 30 días",
      icon: null,
      accent: "from-slate-50 to-slate-100/50",
    },
    {
      title: "Racha actual",
      value: stats.currentStreak > 0 ? `${stats.currentStreak} días` : "0 días",
      sub: <span className="text-slate-400 text-sm">{stats.daysTracked} días totales</span>,
      subLabel: "",
      icon: <Flame size={18} className="text-orange-500" />,
      accent: "from-orange-50 to-orange-100/50",
    },
    {
      title: "Días trackeados",
      value: `${stats.daysTracked}`,
      sub: null,
      subLabel: "registros totales",
      icon: <Calendar size={18} className="text-indigo-500" />,
      accent: "from-indigo-50 to-indigo-100/50",
    },
    {
      title: "Mínimo histórico",
      value: stats.lowestWeight ? formatWeight(stats.lowestWeight) : "—",
      sub: stats.lowestWeightDate ? <span className="text-slate-400 text-sm">{formatDate(stats.lowestWeightDate)}</span> : null,
      subLabel: "",
      icon: <TrendingDown size={18} className="text-emerald-500" />,
      accent: "from-emerald-50 to-emerald-100/50",
    },
    {
      title: "Máximo histórico",
      value: stats.highestWeight ? formatWeight(stats.highestWeight) : "—",
      sub: stats.highestWeightDate ? <span className="text-slate-400 text-sm">{formatDate(stats.highestWeightDate)}</span> : null,
      subLabel: "",
      icon: <TrendingUp size={18} className="text-rose-500" />,
      accent: "from-rose-50 to-rose-100/50",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map((card) => (
        <Card key={card.title} className={`bg-gradient-to-br ${card.accent}`}>
          <CardHeader className="pb-1">
            <div className="flex items-center justify-between">
              <CardTitle>{card.title}</CardTitle>
              {card.icon}
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-slate-800 leading-tight">{card.value}</p>
            {(card.sub || card.subLabel) && (
              <div className="mt-1 flex items-center gap-1">
                {card.sub}
                {card.subLabel && <span className="text-xs text-slate-400">{card.subLabel}</span>}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
