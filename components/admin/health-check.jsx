"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/auth/field";

// Calls the admin-only health endpoint, which pings each configured provider's free "list models/account" API.
export function HealthCheck() {
  const [state, setState] = useState({ busy: false, rows: null, error: "" });
  async function run() {
    setState({ busy: true, rows: null, error: "" });
    try {
      const res = await fetch("/api/ai/health", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Health check failed.");
      setState({ busy: false, rows: data.providers, error: "" });
    } catch (err) { setState({ busy: false, rows: null, error: err.message }); }
  }
  return (
    <div className="space-y-3">
      <Button onClick={run} disabled={state.busy}>{state.busy ? "Checking…" : "Run health check"}</Button>
      <FormAlert>{state.error}</FormAlert>
      {state.rows && (
        <ul className="divide-y rounded-lg border bg-card text-sm">
          {state.rows.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3 p-3">
              <span className="font-medium">{p.name}</span>
              <span className={p.ok ? "text-accent" : "text-muted-foreground"}>
                {!p.configured ? "Not configured" : p.ok ? `Healthy (${p.latencyMs} ms)` : `Failing: ${p.error}`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
