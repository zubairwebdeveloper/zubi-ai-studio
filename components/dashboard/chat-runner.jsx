"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/auth/field";
import { DocumentUploader } from "@/components/dashboard/document-uploader";

const POLL_MS = 1200;
const MAX_WAIT_MS = 120_000;

// Multi-turn chat. Every message is its own job; the last few turns are sent along as context.
// The conversation lives in this page only (it is not saved), but each reply appears in History.
export function ChatRunner({ toolSlug, placeholder, maxChars, credits, notice, needsDocument = false }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [doc, setDoc] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const keyRef = useRef(null);
  const alive = useRef(true);
  const endRef = useRef(null);

  useEffect(() => () => { alive.current = false; }, []);
  useEffect(() => { endRef.current?.scrollIntoView({ block: "end" }); }, [messages, busy]);

  async function waitForResult(id) {
    const started = Date.now();
    while (alive.current) {
      const res = await fetch(`/api/jobs/${id}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load the reply.");
      if (data.status === "succeeded") return data.output?.text || "";
      if (data.status === "failed") throw new Error(data.error || "The request failed.");
      if (Date.now() - started > MAX_WAIT_MS) throw new Error("This is taking longer than expected. Check History in a minute.");
      await new Promise((r) => setTimeout(r, POLL_MS));
    }
    return null;
  }

  async function send() {
    const message = text.trim();
    if (!message || busy) return;
    setError(""); setBusy(true);
    keyRef.current = keyRef.current || crypto.randomUUID().replace(/-/g, "");
    const history = messages.slice(-12).map((m) => ({ role: m.role, text: m.text }));
    try {
      const res = await fetch("/api/jobs", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolSlug, text: message, assetId: doc?.assetId, history, idempotencyKey: keyRef.current }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Could not send."); keyRef.current = null; setBusy(false); return; }
      setMessages((m) => [...m, { role: "user", text: message }]);
      setText("");
      const reply = await waitForResult(data.id);
      keyRef.current = null;
      if (reply !== null) setMessages((m) => [...m, { role: "assistant", text: reply }]);
    } catch (err) {
      setError(err.message || "Network error. Press Send again to retry safely."); // key kept for network errors
      if (!/network/i.test(err.message || "")) keyRef.current = null;
    } finally {
      if (alive.current) setBusy(false);
    }
  }

  function reset() { setMessages([]); setError(""); keyRef.current = null; }
  const blocked = needsDocument && !doc;

  return (
    <div className="max-w-3xl space-y-4">
      {notice && <div role="note" className="rounded-lg border border-credit/50 bg-credit/10 p-3 text-sm">{notice}</div>}
      {needsDocument && <DocumentUploader disabled={busy} onChange={(info) => { setDoc(info); reset(); }} />}

      <div className="min-h-48 space-y-3 rounded-lg border bg-card p-4" role="log" aria-live="polite" aria-label="Conversation">
        {messages.length === 0 && !busy && (
          <p className="text-sm text-muted-foreground">{blocked ? "Upload a PDF to start chatting about it." : "Send a message to start."}</p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "ml-auto max-w-[85%] rounded-lg bg-primary p-3 text-sm text-primary-foreground" : "max-w-[85%] rounded-lg bg-muted p-3 text-sm"}>
            <p className="mb-1 text-xs opacity-70">{m.role === "user" ? "You" : "Assistant"}</p>
            <div className="whitespace-pre-wrap">{m.text}</div>
          </div>
        ))}
        {busy && <div className="h-10 w-40 animate-pulse rounded-lg bg-muted" role="status" aria-label="Assistant is typing" />}
        <div ref={endRef} />
      </div>

      <FormAlert>{error}</FormAlert>
      <div>
        <label htmlFor="chat-input" className="sr-only">Message</label>
        <textarea id="chat-input" value={text} rows={3} maxLength={maxChars} placeholder={placeholder} disabled={busy || blocked}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          className="w-full rounded-md border border-input bg-card p-3 text-sm placeholder:text-muted-foreground disabled:opacity-60" />
        <p className="mt-1 text-xs text-muted-foreground">Enter to send, Shift+Enter for a new line.</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={send} disabled={busy || blocked || !text.trim()}>{busy ? "Waiting…" : "Send"}</Button>
        <Button variant="outline" onClick={reset} disabled={busy || messages.length === 0}>New chat</Button>
        <span className="text-sm text-muted-foreground">{credits} credits per message, refunded if a reply fails.</span>
      </div>
    </div>
  );
}
