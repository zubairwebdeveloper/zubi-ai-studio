"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/auth/field";
import { setDailyLimit } from "@/lib/actions/credits";

export function DailyLimitForm({ current, spentToday }) {
  const [value, setValue] = useState(String(current));
  const [status, setStatus] = useState({ tone: "ok", text: "" });
  const [pending, start] = useTransition();

  function onSubmit(e) {
    e.preventDefault();
    setStatus({ tone: "ok", text: "" });
    start(async () => {
      const res = await setDailyLimit({ limit: value.trim() === "" ? NaN : Number(value) });
      setStatus(res.ok ? { tone: "ok", text: current === 0 && Number(value) === 0 ? "Saved." : "Daily limit saved." } : { tone: "error", text: res.error });
    });
  }

  return (
    <form onSubmit={onSubmit} className="max-w-md space-y-3" noValidate>
      <div>
        <label htmlFor="daily-limit" className="mb-1.5 block text-sm font-medium">Daily spending limit (credits)</label>
        <input id="daily-limit" inputMode="numeric" value={value} onChange={(e) => setValue(e.target.value)} disabled={pending}
          className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm" aria-describedby="limit-help" />
        <p id="limit-help" className="mt-1 text-xs text-muted-foreground">
          Jobs that would take you past this in one UTC day are refused. Use 0 for no limit. Held today: {spentToday}.
        </p>
      </div>
      <FormAlert tone={status.tone}>{status.text}</FormAlert>
      <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save limit"}</Button>
    </form>
  );
}
