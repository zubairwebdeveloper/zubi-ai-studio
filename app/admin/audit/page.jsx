import { PageHeader, EmptyState } from "@/components/dashboard/page-header";
import { requirePermission } from "@/lib/admin/guard";
import { listAudit } from "@/lib/admin/data";
import { formatDateTime } from "@/lib/helpers/format";

export const metadata = { title: "Audit log | Admin" };

export default async function AuditPage() {
  await requirePermission("audit.read");
  const rows = await listAudit(100);
  return (
    <>
      <PageHeader title="Audit log" description="The latest 100 administrative actions. Entries cannot be edited from the app." />
      {rows.length === 0 ? <EmptyState title="No admin actions recorded yet" /> : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b text-muted-foreground"><tr>
              <th className="p-3 font-medium">When</th><th className="p-3 font-medium">Who</th><th className="p-3 font-medium">Action</th><th className="p-3 font-medium">Target</th><th className="p-3 font-medium">Details</th></tr></thead>
            <tbody className="divide-y">
              {rows.map((a) => (
                <tr key={a.id}>
                  <td className="p-3 whitespace-nowrap">{formatDateTime(a.createdAt)}</td>
                  <td className="p-3">{a.actor}{a.actorRole ? ` (${a.actorRole})` : ""}</td>
                  <td className="p-3 font-mono text-xs">{a.action}</td>
                  <td className="p-3">{a.target}</td>
                  <td className="p-3 text-muted-foreground">{JSON.stringify(a.details)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
