"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/auth/field";
import { DocumentUploader } from "@/components/dashboard/document-uploader";

const POLL_MS = 1500;
const MAX_WAIT_MS = 180_000;

export function TextToolRunner({ toolSlug, label, placeholder, maxChars, credits, options = [], notice, needsText = true, needsDocument = false }) {
  const [text, setText] = useState("");
  const [doc, setDoc] = useState(null);
  const [values, setValues] = useState(() => Object.fromEntries(options.map((o) => [o.name, o.choices[0]])));
  const [phase, setPhase] = useState("idle"); // idle | working | done | error
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const keyRef = useRef(null);   // reused after a network drop so one click never creates two jobs
  const timer = useRef(null);
  const alive = useRef(true);

  useEffect(() => () => { alive.current = false; clearTimeout(timer.current); }, []);

  async function poll(id, startedAt) {
    if (!alive.current) return;
    try {
      const res = await fetch(`/api/jobs/${id}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load the result.");
      if (data.status === "succeeded") { setOutput(data.output?.text || ""); setPhase("done"); keyRef.current = null; return; }
      if (data.status === "failed") { setError(data.error || "The request failed."); setPhase("error"); keyRef.current = null; return; }
      if (Date.now() - startedAt > MAX_WAIT_MS) { setError("This is taking longer than expected. Check History in a minute."); setPhase("error"); return; }
      timer.current = setTimeout(() => poll(id, startedAt), POLL_MS);
    } catch (err) {
      setError(err.message || "Network error."); setPhase("error");
    }
  }

  async function run() {
    setError(""); setOutput(""); setPhase("working");
    keyRef.current = keyRef.current || crypto.randomUUID().replace(/-/g, "");
    try {
      const res = await fetch("/api/jobs", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolSlug, text, assetId: doc?.assetId, options: values, idempotencyKey: keyRef.current }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Could not start the job."); setPhase("error"); keyRef.current = null; return; }
      poll(data.id, Date.now());
    } catch {
      setError("Network error. Press Run again to retry safely."); setPhase("error"); // key kept on purpose
    }
  }

  const working = phase === "working";
  const ready = (!needsText || text.trim()) && (!needsDocument || doc);

  function download() {
    const url = URL.createObjectURL(new Blob([output], { type: "text/plain;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = `${toolSlug}.txt`; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="max-w-3xl space-y-4">
      {notice && <div role="note" className="rounded-lg border border-credit/50 bg-credit/10 p-3 text-sm">{notice}</div>}
      {needsDocument && <DocumentUploader disabled={working} onChange={(info) => { setDoc(info); keyRef.current = null; }} />}
      {options.length > 0 && (
        <div className="flex flex-wrap gap-4">
          {options.map((o) => (
            <div key={o.name}>
              <label htmlFor={`opt-${o.name}`} className="mb-1.5 block text-sm font-medium">{o.label}</label>
              <select id={`opt-${o.name}`} value={values[o.name]} disabled={working} onChange={(e) => setValues((v) => ({ ...v, [o.name]: e.target.value }))}
                className="h-10 rounded-md border border-input bg-card px-3 text-sm">
                {o.choices.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          ))}
        </div>
      )}
      {needsText && (
        <div>
          <label htmlFor="tool-input" className="mb-1.5 block text-sm font-medium">{label}</label>
          <textarea id="tool-input" value={text} onChange={(e) => setText(e.target.value)} maxLength={maxChars} rows={needsDocument ? 3 : 8} placeholder={placeholder} disabled={working}
            className="w-full rounded-md border border-input bg-card p-3 text-sm placeholder:text-muted-foreground disabled:opacity-60" />
          <p className="mt-1 text-xs text-muted-foreground">{text.length.toLocaleString()} / {maxChars.toLocaleString()} characters</p>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={run} disabled={working || !ready}>{working ? "Working…" : "Run"}</Button>
        <span className="text-sm text-muted-foreground">Cost: {credits} credits, held when you run and refunded if it fails.</span>
      </div>
      <FormAlert>{error}</FormAlert>
      {working && <div className="h-24 animate-pulse rounded-lg bg-muted" role="status" aria-label="Generating" />}
      {phase === "done" && (
        <section aria-labelledby="out-h" className="rounded-lg border bg-card p-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 id="out-h" className="font-semibold">Result</h2>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={async () => { await navigator.clipboard.writeText(output); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>{copied ? "Copied" : "Copy"}</Button>
              <Button size="sm" variant="outline" onClick={download}>Download .txt</Button>
            </div>
          </div>
          <div className="whitespace-pre-wrap text-sm">{output}</div>
        </section>
      )}
    </div>
  );
}
