import { Button } from "@/components/ui/button";
import { PageHeader, EmptyState } from "@/components/dashboard/page-header";
import { DailyLimitForm } from "@/components/dashboard/daily-limit-form";
import { requireUser } from "@/lib/auth/session";
import { credits } from "@/lib/credits/service";
import { toIso, formatDate } from "@/lib/helpers/format";

export const metadata = { title: "Credits" };

const LABEL = { grant: "Credits added", adjust: "Adjustment", reserve: "Held for a job", capture: "Used", release: "Refunded" };

function change(t) {
  if (t.type === "reserve") return `−${t.amount} (held)`;
  if (t.type === "capture") return `${t.amount} used`;
  return t.delta > 0 ? `+${t.delta}` : String(t.delta);
}

function Stat({ label, value, hint }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value.toLocaleString()}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export default async function CreditsPage() {
  const user = await requireUser();
  const [summary, rows] = await Promise.all([credits.getSummary(user.uid), credits.listTransactions(user.uid, 50)]);
  const transactions = rows.map((t) => ({ ...t, createdAt: toIso(t.createdAt) }));

  return (
    <div className="space-y-10">
      <PageHeader title="Credits" description="Credits are held when a job starts, used when it succeeds, and refunded in full if it fails."
        action={<Button disabled title="Payments are not available yet">Buy credits (coming soon)</Button>} />

      <section aria-label="Balance" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Available" value={summary.available} hint="Ready to use" />
        <Stat label="On hold" value={summary.reserved} hint="Reserved by running jobs" />
        <Stat label="Used (all time)" value={summary.lifetimeSpent} />
        <Stat label="Received (all time)" value={summary.lifetimeGranted} />
      </section>

      <section aria-labelledby="limit-h">
        <h2 id="limit-h" className="mb-3 text-lg font-semibold">Spending limit</h2>
        <DailyLimitForm current={summary.dailyLimit} spentToday={summary.daySpent} />
      </section>

      <section aria-labelledby="tx-h">
        <h2 id="tx-h" className="mb-3 text-lg font-semibold">Recent activity</h2>
        {transactions.length === 0 ? (
          <EmptyState title="No credit activity yet">Every change to your balance is listed here.</EmptyState>
        ) : (
          <div className="overflow-x-auto rounded-lg border bg-card">
            <table className="w-full text-left text-sm">
              <thead className="border-b text-muted-foreground">
                <tr><th className="p-3 font-medium">Date</th><th className="p-3 font-medium">Type</th><th className="p-3 font-medium">Details</th><th className="p-3 font-medium">Change</th><th className="p-3 font-medium">Available after</th></tr>
              </thead>
              <tbody className="divide-y">
                {transactions.map((t) => (
                  <tr key={t.id}>
                    <td className="p-3">{formatDate(t.createdAt)}</td>
                    <td className="p-3">{LABEL[t.type] || t.type}</td>
                    <td className="p-3 text-muted-foreground">{t.reason}</td>
                    <td className="p-3 font-medium">{change(t)}</td>
                    <td className="p-3">{t.availableAfter}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
