"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function LoginForm() {
  const router = useRouter();
  const next = useSearchParams().get("next");
  // Only allow same-site relative redirects.
  const target = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";

  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.replace(target);
        router.refresh();
        return;
      }
      const json = await res.json().catch(() => ({}));
      setError(json.error ?? "No pude verificar la contraseña.");
    } catch {
      setError("No pude verificar la contraseña.");
    }
    setLoading(false);
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="items-center text-center">
        <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Lock size={18} />
        </div>
        <h1 className="text-lg font-semibold text-slate-800">Entrá a tu tracker</h1>
        <p className="text-sm text-slate-500">Ingresá la contraseña para ver tus registros.</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <label htmlFor="password" className="sr-only">Contraseña</label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            required
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading || !password}>
            {loading ? "Verificando..." : "Entrar"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
