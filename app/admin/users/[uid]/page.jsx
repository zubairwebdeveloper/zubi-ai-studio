import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader, EmptyState } from "@/components/dashboard/page-header";
import { UserActions } from "@/components/admin/user-actions";
import { requirePermission } from "@/lib/admin/guard";
import { getUserDetail } from "@/lib/admin/data";
import { can, canActOn, adjustLimitFor } from "@/lib/admin/permissions";
import { formatDateTime } from "@/lib/helpers/format";

export const metadata = { title: "User | Admin" };

export default async function UserDetailPage({ params }) {
  const actor = await requirePermission("users.read");
  const detail = await getUserDetail((await params).uid);
  if (!detail) notFound();
  const { user, wallet, generations, ledger } = detail;
  const outranks = canActOn(actor.role, user.role);

  return (
    <>
      <p className="mb-2 text-sm"><Link href="/admin/users" className="text-primary">← Users</Link></p>
      <PageHeader title={user.email || user.uid} description={`${user.name || "No name"} · ${user.role} · ${user.status}`} />

      <section aria-label="Account" className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[["Role", user.role], ["Status", user.status], ["Joined", formatDateTime(user.createdAt)], ["Last login", formatDateTime(user.lastLoginAt) || "Never"],
          ["Available credits", wallet ? wallet.available : "No wallet yet"], ["On hold", wallet ? wallet.reserved : "–"], ["Used", wallet ? wallet.lifetimeSpent : "–"], ["Received", wallet ? wallet.lifetimeGranted : "–"]].map(([k, v]) => (
          <div key={k} className="rounded-lg border bg-card p-4"><p className="text-sm text-muted-foreground">{k}</p><p className="mt-1 font-semibold">{String(v)}</p></div>
        ))}
      </section>

      <section aria-labelledby="actions-h" className="mb-10 max-w-xl">
        <h2 id="actions-h" className="mb-3 text-lg font-semibold">Actions</h2>
        {outranks || actor.uid === user.uid ? (
          <UserActions uid={user.uid} status={user.status} role={user.role} isSelf={actor.uid === user.uid}
            canSuspend={can(actor.role, "users.suspend")} canRole={can(actor.role, "roles.manage")}
            canAdjust={can(actor.role, "credits.adjust")} adjustLimit={adjustLimitFor(actor.role)} />
        ) : (
          <p className="text-sm text-muted-foreground">You cannot change this account because it has the same or a higher role than yours.</p>
        )}
      </section>

      <section aria-labelledby="g-h" className="mb-10">
        <h2 id="g-h" className="mb-3 text-lg font-semibold">Recent generations</h2>
        {generations.length === 0 ? <EmptyState title="No generations" /> : (
          <ul className="divide-y rounded-lg border bg-card text-sm">
            {generations.map((g) => <li key={g.id} className="flex flex-wrap justify-between gap-2 p-3"><span className="font-medium">{g.toolName}</span><span className="text-muted-foreground">{g.status}{g.error ? ` · ${g.error}` : ""} · {formatDateTime(g.createdAt)}</span></li>)}
          </ul>
        )}
      </section>

      <section aria-labelledby="l-h">
        <h2 id="l-h" className="mb-3 text-lg font-semibold">Recent credit ledger</h2>
        {ledger.length === 0 ? <EmptyState title="No credit activity" /> : (
          <ul className="divide-y rounded-lg border bg-card text-sm">
            {ledger.map((t) => <li key={t.id} className="flex flex-wrap justify-between gap-2 p-3"><span>{t.type} · {t.delta > 0 ? `+${t.delta}` : t.delta} · {t.reason}</span><span className="text-muted-foreground">{t.actor} · {formatDateTime(t.createdAt)}</span></li>)}
          </ul>
        )}
      </section>
    </>
  );
}
