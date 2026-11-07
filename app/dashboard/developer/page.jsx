import { PageHeader, EmptyState } from "@/components/dashboard/page-header";
import { ApiKeysManager } from "@/components/dashboard/api-keys-manager";
import { requireUser } from "@/lib/auth/session";
import { apiKeys } from "@/lib/api/service";
import { toIso } from "@/lib/helpers/format";

export const metadata = { title: "Developer" };

export default async function DeveloperPage() {
  const user = await requireUser();
  const [keys, usage] = await Promise.all([apiKeys.list(user.uid), apiKeys.usage(user.uid, 60)]);
  const list = keys.map((k) => ({ ...k, createdAt: toIso(k.createdAt), lastUsedAt: typeof k.lastUsedAt === "number" ? new Date(k.lastUsedAt).toISOString() : toIso(k.lastUsedAt) }));
  const byDay = new Map();
  for (const u of usage) { const d = byDay.get(u.day) || { day: u.day, requests: 0, jobsCreated: 0 }; d.requests += u.requests; d.jobsCreated += u.jobsCreated; byDay.set(u.day, d); }
  const days = [...byDay.values()].slice(0, 14);

  return (
    <div className="space-y-10">
      <PageHeader title="Developer" description="API keys for calling AI Studio from your own server. API calls spend the same credits as the dashboard and follow the same limits." />
      <section aria-labelledby="keys-h"><h2 id="keys-h" className="mb-3 text-lg font-semibold">API keys</h2><ApiKeysManager keys={list} /></section>

      <section aria-labelledby="usage-h">
        <h2 id="usage-h" className="mb-3 text-lg font-semibold">Usage (last 14 days)</h2>
        {days.length === 0 ? <EmptyState title="No API calls yet" /> : (
          <div className="max-w-xl overflow-x-auto rounded-lg border bg-card">
            <table className="w-full text-left text-sm">
              <thead className="border-b text-muted-foreground"><tr><th className="p-3 font-medium">Day (UTC)</th><th className="p-3 font-medium">Requests</th><th className="p-3 font-medium">Jobs started</th></tr></thead>
              <tbody className="divide-y">{days.map((d) => <tr key={d.day}><td className="p-3">{d.day}</td><td className="p-3">{d.requests.toLocaleString()}</td><td className="p-3">{d.jobsCreated.toLocaleString()}</td></tr>)}</tbody>
            </table>
          </div>
        )}
      </section>

      <section aria-labelledby="qs-h" className="max-w-3xl">
        <h2 id="qs-h" className="mb-3 text-lg font-semibold">Quick start</h2>
        <pre className="overflow-x-auto rounded-lg border bg-card p-4 text-xs">{`curl -X POST https://YOUR_DOMAIN/api/v1/jobs \\
  -H "Authorization: Bearer ais_YOUR_KEY" \\
  -H "Idempotency-Key: $(uuidgen | tr -d -)" \\
  -H "Content-Type: application/json" \\
  -d '{"tool":"ai-translator","text":"Hello","options":{"targetLanguage":"Urdu"}}'

curl https://YOUR_DOMAIN/api/v1/jobs/JOB_ID -H "Authorization: Bearer ais_YOUR_KEY"`}</pre>
        <p className="mt-2 text-sm text-muted-foreground">See docs/API.md for every endpoint, error codes and limits.</p>
      </section>
    </div>
  );
}
