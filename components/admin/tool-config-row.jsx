"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { updateToolConfig } from "@/lib/actions/admin";

export function ToolConfigRow({ slug, enabled: initialEnabled, override, defaultCredits }) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [credits, setCredits] = useState(override === null ? "" : String(override));
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");
  const dirty = enabled !== initialEnabled || credits !== (override === null ? "" : String(override));

  function save() {
    setMsg("");
    start(async () => {
      const res = await updateToolConfig({ slug, enabled, credits: credits.trim() === "" ? null : Number(credits) });
      setMsg(res.ok ? "Saved" : res.error);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} disabled={pending} />
        <span>{enabled ? "On" : "Off"}</span>
      </label>
      <label className="sr-only" htmlFor={`price-${slug}`}>Price override for {slug}</label>
      <input id={`price-${slug}`} inputMode="numeric" placeholder={`${defaultCredits} (default)`} value={credits} onChange={(e) => setCredits(e.target.value)} disabled={pending}
        className="h-9 w-32 rounded-md border border-input bg-card px-2 text-sm" />
      <Button size="sm" variant="outline" onClick={save} disabled={pending || !dirty}>{pending ? "Saving…" : "Save"}</Button>
      <span className="text-xs text-muted-foreground" role="status">{msg}</span>
    </div>
  );
}
