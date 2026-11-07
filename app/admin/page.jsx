import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { requirePermission } from "@/lib/admin/guard";
import { getOverview } from "@/lib/admin/data";

export const metadata = { title: "Admin" };

function Stat({ label, value, href, warn }) {
  const body = (
    <div className={`rounded-lg border bg-card p-4 ${warn && value > 0 ? "border-destructive/50" : ""}`}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value.toLocaleString()}</p>
    </div>
  );
  return href ? <Link href={href} className="block hover:opacity-90">{body}</Link> : body;
}

export default async function AdminOverviewPage() {
  await requirePermission("analytics.read");
  const o = await getOverview();
  return (
    <>
      <PageHeader title="Overview" description="Live counts. Revenue and provider cost reporting arrive with billing." />
      <section aria-label="Summary" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Stat label="Users" value={o.users} href="/admin/users" />
        <Stat label="Suspended users" value={o.suspended} href="/admin/users" />
        <Stat label="Generations today (UTC)" value={o.today} href="/admin/jobs" />
        <Stat label="Failed today" value={o.failedToday} href="/admin/jobs?view=failed" warn />
        <Stat label="Jobs needing review" value={o.review} href="/admin/jobs?view=review" warn />
      </section>
    </>
  );
}
