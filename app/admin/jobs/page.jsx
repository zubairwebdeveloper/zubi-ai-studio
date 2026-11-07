import Link from "next/link";
import { PageHeader, EmptyState } from "@/components/dashboard/page-header";
import { requirePermission } from "@/lib/admin/guard";
import { listJobs } from "@/lib/admin/data";
import { formatDateTime } from "@/lib/helpers/format";
import { cn } from "@/lib/utils";

export const metadata = { title: "Jobs | Admin" };
const VIEWS = [["all", "All"], ["failed", "Failed"], ["review", "Needs review"]];

export default async function JobsPage({ searchParams }) {
  await requirePermission("jobs.read");
  const view = VIEWS.some(([v]) => v === (await searchParams).view) ? (await searchParams).view : "all";
  const jobs = await listJobs(view);

  return (
    <>
      <PageHeader title="Jobs" description={view === "review" ? "Jobs where the provider may have been charged but the output was lost. Credits were refunded to the user." : "The latest 50, newest first."} />
      <div className="mb-4 flex gap-2" role="tablist" aria-label="Job view">
        {VIEWS.map(([v, label]) => (
          <Link key={v} href={`/admin/jobs?view=${v}`} role="tab" aria-selected={view === v}
            className={cn("rounded-full border px-3 py-1 text-sm", view === v ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted")}>{label}</Link>
        ))}
      </div>
      {jobs.length === 0 ? <EmptyState title="Nothing here" /> : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b text-muted-foreground"><tr>
              <th className="p-3 font-medium">When</th><th className="p-3 font-medium">Tool</th><th className="p-3 font-medium">User</th><th className="p-3 font-medium">Status</th><th className="p-3 font-medium">Detail</th></tr></thead>
            <tbody className="divide-y">
              {jobs.map((j) => (
                <tr key={j.id}>
                  <td className="p-3 whitespace-nowrap">{formatDateTime(j.createdAt)}</td>
                  <td className="p-3">{j.toolName || j.toolSlug}</td>
                  <td className="p-3"><Link href={`/admin/users/${j.userId}`} className="text-primary">{String(j.userId).slice(0, 8)}…</Link></td>
                  <td className="p-3">{j.status}</td>
                  <td className="p-3 text-muted-foreground">{view === "review" ? `${j.providerId} · attempts ${j.attempts} · ${j.code}: ${j.error}` : j.error || (j.credits !== null ? `${j.credits} credits` : "")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
