import Link from "next/link";
import { PageHeader, EmptyState } from "@/components/dashboard/page-header";
import { requirePermission } from "@/lib/admin/guard";
import { listLedger } from "@/lib/admin/data";
import { formatDateTime } from "@/lib/helpers/format";

export const metadata = { title: "Credits | Admin" };

export default async function AdminCreditsPage() {
  await requirePermission("credits.read");
  const rows = await listLedger(50);
  return (
    <>
      <PageHeader title="Credit ledger" description="The latest 50 entries across all users. To adjust a balance, open the user." />
      {rows.length === 0 ? <EmptyState title="No credit activity yet" /> : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b text-muted-foreground"><tr>
              <th className="p-3 font-medium">When</th><th className="p-3 font-medium">User</th><th className="p-3 font-medium">Type</th><th className="p-3 font-medium">Change</th><th className="p-3 font-medium">Reason</th><th className="p-3 font-medium">By</th></tr></thead>
            <tbody className="divide-y">
              {rows.map((t) => (
                <tr key={t.id}>
                  <td className="p-3 whitespace-nowrap">{formatDateTime(t.createdAt)}</td>
                  <td className="p-3"><Link href={`/admin/users/${t.userId}`} className="text-primary">{String(t.userId).slice(0, 8)}…</Link></td>
                  <td className="p-3">{t.type}</td>
                  <td className="p-3 font-medium">{t.type === "capture" ? `${t.amount} used` : t.delta > 0 ? `+${t.delta}` : t.delta}</td>
                  <td className="p-3 text-muted-foreground">{t.reason}</td>
                  <td className="p-3 text-muted-foreground">{t.actor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
