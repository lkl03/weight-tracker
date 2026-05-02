"use client";

import { useState } from "react";
import type { WeightEntry } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";
import { Pencil, Trash2, Check, X, Search } from "lucide-react";
import { Select } from "@/components/ui/select";

const sourceLabels: Record<WeightEntry["source"], string> = {
  telegram: "Telegram",
  manual: "Manual",
  "auto-filled": "Autocompletado",
  import: "Importado",
};

const sourceVariant: Record<WeightEntry["source"], "default" | "success" | "warning" | "neutral"> = {
  telegram: "default",
  manual: "success",
  "auto-filled": "warning",
  import: "neutral",
};

function weekNumber(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  const jan1 = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil((((d.getTime() - jan1.getTime()) / 86400000) + jan1.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

function monthStr(dateStr: string): string {
  return dateStr.slice(0, 7);
}

type PeriodFilter = "all" | "week" | "month" | "year";

interface EditState {
  id: string;
  weightKg: string;
  time: string;
  notes: string;
}

interface Props {
  entries: WeightEntry[];
  onDelete: (id: string) => Promise<void>;
  onEdit: (id: string, data: Partial<WeightEntry>) => Promise<void>;
}

export function EntriesTable({ entries, onDelete, onEdit }: Props) {
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState<PeriodFilter>("all");
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [monthFilter, setMonthFilter] = useState<string>("all");
  const [editing, setEditing] = useState<EditState | null>(null);
  const [sortAsc, setSortAsc] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  const years = [...new Set(entries.map((e) => e.date.slice(0, 4)))].sort((a, b) => b.localeCompare(a));
  const months = [...new Set(entries.map((e) => e.date.slice(0, 7)))].sort((a, b) => b.localeCompare(a));

  const now = new Date();
  const currentWeek = weekNumber(now.toISOString().split("T")[0]);
  const currentMonth = now.toISOString().slice(0, 7);
  const currentYear = String(now.getFullYear());

  const filtered = entries
    .filter((e) => {
      if (search) {
        const q = search.toLowerCase();
        if (!e.notes?.toLowerCase().includes(q) && !e.date.includes(q) && !String(e.weightKg).includes(q)) return false;
      }
      if (period === "week") return weekNumber(e.date) === currentWeek;
      if (period === "month") return monthStr(e.date) === (monthFilter !== "all" ? monthFilter : currentMonth);
      if (period === "year") return e.date.startsWith(yearFilter !== "all" ? yearFilter : currentYear);
      if (yearFilter !== "all") return e.date.startsWith(yearFilter);
      if (monthFilter !== "all") return e.date.startsWith(monthFilter);
      return true;
    })
    .sort((a, b) => {
      const cmp = a.date.localeCompare(b.date) || a.time.localeCompare(b.time);
      return sortAsc ? cmp : -cmp;
    });

  function startEdit(e: WeightEntry) {
    setEditing({ id: e.id, weightKg: String(e.weightKg), time: e.time, notes: e.notes ?? "" });
  }

  async function saveEdit() {
    if (!editing) return;
    setLoading(editing.id);
    await onEdit(editing.id, {
      weightKg: parseFloat(editing.weightKg),
      time: editing.time,
      notes: editing.notes || null,
    });
    setEditing(null);
    setLoading(null);
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este registro?")) return;
    setLoading(id);
    await onDelete(id);
    setLoading(null);
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Buscar notas, fecha, peso..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 w-52"
          />
        </div>
        <Select value={period} onChange={(e) => setPeriod(e.target.value as PeriodFilter)}>
          <option value="all">Todo el histórico</option>
          <option value="week">Esta semana</option>
          <option value="month">Este mes</option>
          <option value="year">Este año</option>
        </Select>
        <Select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)}>
          <option value="all">Todos los años</option>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </Select>
        <Select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)}>
          <option value="all">Todos los meses</option>
          {months.map((m) => <option key={m} value={m}>{m}</option>)}
        </Select>
        <span className="text-xs text-slate-400 ml-auto">{filtered.length} registros</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-white/20">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200/80 bg-slate-50/80">
              <th
                className="px-4 py-3 text-left text-xs font-semibold text-slate-500 cursor-pointer select-none hover:text-slate-700"
                onClick={() => setSortAsc(!sortAsc)}
              >
                Fecha {sortAsc ? "↑" : "↓"}
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Hora</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Peso</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Notas</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Fuente</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-slate-400 text-sm">
                  No hay registros para este filtro.
                </td>
              </tr>
            )}
            {filtered.map((entry, idx) => {
              const isEditing = editing?.id === entry.id;
              const prevEntry = filtered[idx + (sortAsc ? -1 : 1)];
              const delta = prevEntry ? entry.weightKg - prevEntry.weightKg : null;

              return (
                <tr
                  key={entry.id}
                  className={`border-b border-slate-100 transition-colors ${isEditing ? "bg-blue-50/60" : "hover:bg-slate-50/60"}`}
                >
                  <td className="px-4 py-2.5 font-medium text-slate-700">{formatDate(entry.date)}</td>
                  <td className="px-4 py-2.5 text-slate-500 tabular-nums">
                    {isEditing ? (
                      <Input
                        type="time"
                        value={editing.time}
                        onChange={(e) => setEditing({ ...editing, time: e.target.value })}
                        className="w-24 h-7 text-xs"
                      />
                    ) : entry.time}
                  </td>
                  <td className="px-4 py-2.5 font-semibold text-slate-800 tabular-nums">
                    {isEditing ? (
                      <Input
                        type="number"
                        step="0.1"
                        value={editing.weightKg}
                        onChange={(e) => setEditing({ ...editing, weightKg: e.target.value })}
                        className="w-20 h-7 text-xs"
                      />
                    ) : (
                      <span className="flex items-center gap-1.5">
                        {entry.weightKg.toFixed(1)} kg
                        {delta !== null && delta !== 0 && (
                          <span className={`text-xs font-normal ${delta < 0 ? "text-emerald-500" : "text-rose-500"}`}>
                            {delta > 0 ? "+" : ""}{delta.toFixed(1)}
                          </span>
                        )}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-slate-500 max-w-[200px]">
                    {isEditing ? (
                      <Input
                        value={editing.notes}
                        onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
                        placeholder="Notas..."
                        className="h-7 text-xs"
                      />
                    ) : (
                      <span className="truncate block">{entry.notes ?? ""}</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge variant={sourceVariant[entry.source]}>{sourceLabels[entry.source]}</Badge>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {isEditing ? (
                      <div className="flex items-center justify-end gap-1">
                        <Button size="sm" variant="primary" onClick={saveEdit} disabled={!!loading}>
                          <Check size={13} />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
                          <X size={13} />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => startEdit(entry)} disabled={!!loading}>
                          <Pencil size={13} />
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => handleDelete(entry.id)} disabled={loading === entry.id}>
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
