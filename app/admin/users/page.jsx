import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader, EmptyState } from "@/components/dashboard/page-header";
import { requirePermission } from "@/lib/admin/guard";
import { listUsers } from "@/lib/admin/data";
import { formatDate } from "@/lib/helpers/format";

export const metadata = { title: "Users | Admin" };

export default async function UsersPage({ searchParams }) {
  await requirePermission("users.read");
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.slice(0, 100) : "";
  const after = typeof sp.after === "string" ? sp.after.slice(0, 200) : "";
  const { rows, next } = await listUsers({ q, after });
  const qs = (extra) =>
    new URLSearchParams({ ...(q ? { q } : {}), ...extra }).toString();

  return (
    <>
      <PageHeader
        title="Users"
        description="Search by email prefix or paste a user id."
      />
      <form role="search" className="mb-4 flex max-w-md gap-2">
        <label htmlFor="user-q" className="sr-only">
          Search users
        </label>
        <input
          id="user-q"
          name="q"
          defaultValue={q}
          placeholder="email prefix or user id"
          className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
        />
        <Button type="submit">Search</Button>
      </form>
      {rows.length === 0 ? (
        <EmptyState title="No users found">
          Try a shorter email prefix.
        </EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b text-muted-foreground">
              <tr>
                <th className="p-3 font-medium">Email</th>
                <th className="p-3 font-medium">Role</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((u) => (
                <tr key={u.uid}>
                  <td className="p-3">
                    <Link
                      href={`/admin/users/${u.uid}`}
                      className="font-medium text-primary"
                    >
                      {u.email || u.uid}
                    </Link>
                    {u.name && (
                      <span className="ml-2 text-muted-foreground">
                        {u.name}
                      </span>
                    )}
                  </td>
                  <td className="p-3">{u.role}</td>
                  <td className="p-3">
                    {u.status === "suspended" ? (
                      <span className="text-destructive">suspended</span>
                    ) : (
                      u.status
                    )}
                  </td>
                  <td className="p-3">{formatDate(u.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {next && (
        <div className="mt-4">
          <Button variant="outline">
            <Link href={`/admin/users?${qs({ after: next })}`}>Next page</Link>
          </Button>
        </div>
      )}
    </>
  );
}
