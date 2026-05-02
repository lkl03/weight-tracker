"use client";

import { useEffect, useState, useCallback } from "react";
import type { WeightEntry } from "@/types";
import { EntriesTable } from "@/components/history/EntriesTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Download } from "lucide-react";

function today(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Argentina/Buenos_Aires" });
}

function nowTime(): string {
  return new Date().toLocaleTimeString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export default function HistoryPage() {
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ date: today(), time: nowTime(), weightKg: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/entries");
      const json = await res.json();
      setEntries(json.entries ?? []);
    } catch {
      setError("Error cargando registros.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  async function handleDelete(id: string) {
    await fetch(`/api/entries/${id}`, { method: "DELETE" });
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  async function handleEdit(id: string, data: Partial<WeightEntry>) {
    const res = await fetch(`/api/entries/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (json.entry) {
      setEntries((prev) => prev.map((e) => (e.id === id ? json.entry : e)));
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!addForm.weightKg) return;
    setSaving(true);
    try {
      const res = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: addForm.date,
          time: addForm.time,
          weightKg: parseFloat(addForm.weightKg),
          notes: addForm.notes || null,
          source: "manual",
        }),
      });
      const json = await res.json();
      if (json.entry) {
        setEntries((prev) => [json.entry, ...prev]);
        setShowAdd(false);
        setAddForm({ date: today(), time: nowTime(), weightKg: "", notes: "" });
      }
    } finally {
      setSaving(false);
    }
  }

  function exportCSV() {
    const rows = [
      ["Fecha", "Hora", "Peso (kg)", "Notas", "Fuente"],
      ...entries.map((e) => [e.date, e.time, String(e.weightKg), e.notes ?? "", e.source]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `weight-tracker-${today()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Historial</h1>
          <p className="text-sm text-slate-500">{entries.length} registros totales</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={exportCSV}>
            <Download size={14} /> Exportar CSV
          </Button>
          <Button size="sm" onClick={() => setShowAdd(!showAdd)}>
            <Plus size={14} /> Agregar
          </Button>
        </div>
      </div>

      {/* Add form */}
      {showAdd && (
        <Card className="border-blue-200/60 bg-blue-50/40">
          <CardHeader>
            <CardTitle>Nuevo registro manual</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdd} className="flex flex-wrap gap-3 items-end">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-500">Fecha</label>
                <Input
                  type="date"
                  value={addForm.date}
                  onChange={(e) => setAddForm({ ...addForm, date: e.target.value })}
                  className="w-36"
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-500">Hora</label>
                <Input
                  type="time"
                  value={addForm.time}
                  onChange={(e) => setAddForm({ ...addForm, time: e.target.value })}
                  className="w-28"
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-500">Peso (kg)</label>
                <Input
                  type="number"
                  step="0.1"
                  min="30"
                  max="300"
                  placeholder="73.2"
                  value={addForm.weightKg}
                  onChange={(e) => setAddForm({ ...addForm, weightKg: e.target.value })}
                  className="w-24"
                  required
                />
              </div>
              <div className="flex flex-col gap-1 flex-1 min-w-[160px]">
                <label className="text-xs text-slate-500">Notas (opcional)</label>
                <Input
                  placeholder="Notas..."
                  value={addForm.notes}
                  onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })}
                />
              </div>
              <Button type="submit" disabled={saving}>
                {saving ? "Guardando..." : "Guardar"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setShowAdd(false)}>
                Cancelar
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        </div>
      ) : (
        <Card>
          <CardContent className="p-4">
            <EntriesTable entries={entries} onDelete={handleDelete} onEdit={handleEdit} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
