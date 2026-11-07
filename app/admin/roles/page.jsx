import { PageHeader } from "@/components/dashboard/page-header";
import { requirePermission } from "@/lib/admin/guard";
import { PERMISSIONS, ADJUST_LIMITS } from "@/lib/admin/permissions";
import { ROLES } from "@/lib/auth/roles";

export const metadata = { title: "Roles | Admin" };
const ADMIN_ROLES = ROLES.filter((r) => r === "ADMIN" || r === "SUPER_ADMIN");

export default async function RolesPage() {
  await requirePermission("users.read");
  return (
    <>
      <PageHeader title="Roles and permissions" description="Read-only. These rules are enforced on the server for every page and action." />
      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Which role holds which permission</caption>
          <thead className="border-b text-muted-foreground"><tr><th className="p-3 font-medium">Permission</th>{ADMIN_ROLES.map((r) => <th key={r} className="p-3 font-medium">{r}</th>)}</tr></thead>
          <tbody className="divide-y">
            {Object.entries(PERMISSIONS).map(([perm, roles]) => (
              <tr key={perm}><td className="p-3 font-mono text-xs">{perm}</td>{ADMIN_ROLES.map((r) => <td key={r} className="p-3">{roles.includes(r) ? "Yes" : "No"}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="mt-6 max-w-2xl list-disc space-y-1 pl-5 text-sm text-muted-foreground">
        <li>An admin can act on a user only if their role is strictly higher. ADMIN cannot change another ADMIN; nobody can change a SUPER_ADMIN from the UI.</li>
        <li>SUPER_ADMIN is never assigned from the UI. Use the command-line role script.</li>
        <li>Credit adjustments are limited per action: ADMIN up to {ADJUST_LIMITS.ADMIN}, SUPER_ADMIN up to {ADJUST_LIMITS.SUPER_ADMIN.toLocaleString()}. Every adjustment needs a reason.</li>
        <li>Nobody can change their own role, status or credits.</li>
        <li>PRO and AGENCY follow subscriptions once billing exists; they carry no admin permissions.</li>
      </ul>
    </>
  );
}
