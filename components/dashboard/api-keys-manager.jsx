"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/auth/field";
import { EmptyState } from "@/components/dashboard/page-header";
import { createApiKey, revokeApiKey } from "@/lib/actions/api-keys";
import { formatDate } from "@/lib/helpers/format";

export function ApiKeysManager({ keys }) {
  const [name, setName] = useState("");
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const [created, setCreated] = useState(null); // { key, name }: shown once
  const [copied, setCopied] = useState(false);
  const [confirming, setConfirming] = useState("");

  function create(e) {
    e.preventDefault();
    setError(""); setCreated(null);
    start(async () => {
      const res = await createApiKey({ name });
      if (!res.ok) setError(res.error); else { setCreated(res); setName(""); }
    });
  }
  function revoke(publicId) {
    setError("");
    start(async () => {
      const res = await revokeApiKey({ publicId });
      if (!res.ok) setError(res.error);
      setConfirming("");
    });
  }

  return (
    <div className="space-y-8">
      <form onSubmit={create} className="flex max-w-xl flex-wrap items-end gap-3" noValidate>
        <div className="min-w-48 flex-1">
          <label htmlFor="key-name" className="mb-1.5 block text-sm font-medium">New key name</label>
          <input id="key-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} disabled={pending} placeholder="e.g. Production server"
            className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm" />
        </div>
        <Button type="submit" disabled={pending || !name.trim()}>{pending ? "Working…" : "Create key"}</Button>
      </form>
      <FormAlert>{error}</FormAlert>

      {created && (
        <div role="status" className="max-w-2xl rounded-lg border border-credit/60 bg-credit/10 p-4">
          <p className="font-semibold">Copy your key now. You will not be able to see it again.</p>
          <p className="mt-1 text-sm text-muted-foreground">Key “{created.name}”. Store it in a server-side secret manager, never in a browser or a public repository.</p>
          <code className="mt-3 block break-all rounded-md bg-card p-3 text-sm">{created.key}</code>
          <Button className="mt-3" variant="outline" size="sm" onClick={async () => { await navigator.clipboard.writeText(created.key); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>
            {copied ? "Copied" : "Copy key"}
          </Button>
        </div>
      )}

      {keys.length === 0 ? (
        <EmptyState title="No API keys yet">Create a key to call AI Studio from your own server. Calls use the same credits as the dashboard.</EmptyState>
      ) : (
        <ul className="divide-y rounded-lg border bg-card">
          {keys.map((k) => (
            <li key={k.publicId} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="font-medium">{k.name} {k.revoked && <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">Revoked</span>}</p>
                <p className="text-sm text-muted-foreground"><code>{k.prefix}…{k.last4}</code> · created {formatDate(k.createdAt)} · {k.lastUsedAt ? `last used ${formatDate(k.lastUsedAt)}` : "never used"}</p>
              </div>
              {!k.revoked && (confirming === k.publicId ? (
                <div className="flex gap-2">
                  <Button size="sm" className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={pending} onClick={() => revoke(k.publicId)}>Confirm revoke</Button>
                  <Button size="sm" variant="ghost" onClick={() => setConfirming("")}>Cancel</Button>
                </div>
              ) : <Button size="sm" variant="outline" onClick={() => setConfirming(k.publicId)}>Revoke</Button>)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
