import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader, EmptyState } from "@/components/dashboard/page-header";
import { requireUser } from "@/lib/auth/session";
import { listGenerations } from "@/lib/data/dashboard";
import { formatDate } from "@/lib/helpers/format";

export const metadata = { title: "History" };

const statusClass = {
  succeeded: "bg-accent/15 text-accent",
  failed: "bg-destructive/15 text-destructive",
};

export default async function HistoryPage() {
  const user = await requireUser();
  const items = await listGenerations(user.uid, 25);
  return (
    <>
      <PageHeader
        title="Generation history"
        description="Your most recent 25 generations."
      />
      {items.length === 0 ? (
        <EmptyState
          title="No generations yet"
          action={
            <Button>
              <Link href="/dashboard/tools">Browse tools</Link>
            </Button>
          }
        >
          Results from tools you run will be saved here so you can download or
          regenerate them.
        </EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b text-muted-foreground">
              <tr>
                <th className="p-3 font-medium">Tool</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium">Credits</th>
                <th className="p-3 font-medium">Date</th>
                <th className="p-3 font-medium">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((g) => (
                <tr key={g.id}>
                  <td className="p-3 font-medium">{g.toolName}</td>
                  <td className="p-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${statusClass[g.status] || "bg-muted text-muted-foreground"}`}
                    >
                      {g.status}
                    </span>
                  </td>
                  <td className="p-3">{g.credits ?? "–"}</td>
                  <td className="p-3">{formatDate(g.createdAt)}</td>
                  <td className="p-3">
                    {g.outputAssetId ? (
                      <a
                        href={`/api/assets/${g.outputAssetId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary"
                      >
                        View
                      </a>
                    ) : (
                      "–"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
