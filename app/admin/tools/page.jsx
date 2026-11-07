import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader, EmptyState } from "@/components/dashboard/page-header";
import { ToolConfigRow } from "@/components/admin/tool-config-row";
import { StatusBadge } from "@/components/shared/status-badge";
import { requirePermission } from "@/lib/admin/guard";
import { getToolOverrides } from "@/lib/admin/tool-store";
import { getToolRuntime } from "@/lib/ai/availability";
import { searchTools } from "@/lib/tools/registry";
import { categories } from "@/config/categories";

export const metadata = { title: "Tools | Admin" };
const PAGE = 30;

export default async function AdminToolsPage({ searchParams }) {
  await requirePermission("tools.manage");
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.slice(0, 80) : "";
  const category = categories.some((c) => c.id === sp.category)
    ? sp.category
    : "";
  const page = Math.max(1, Number.parseInt(sp.page, 10) || 1);

  const [overrides, runtime] = await Promise.all([
    getToolOverrides(),
    getToolRuntime(),
  ]);
  const all = searchTools(q, { category: category || undefined, sort: "name" });
  const list = all.slice((page - 1) * PAGE, page * PAGE);
  const qs = (extra) =>
    new URLSearchParams({
      ...(q ? { q } : {}),
      ...(category ? { category } : {}),
      ...extra,
    }).toString();

  return (
    <>
      <PageHeader
        title="Tools"
        description="Turn a tool off or override its credit price. Changes reach every server within about 30 seconds. A tool is Live only when a provider is configured, the tool is on, and it has an engine binding."
      />
      <form role="search" className="mb-4 flex flex-wrap gap-2">
        <label htmlFor="tool-q" className="sr-only">
          Search tools
        </label>
        <input
          id="tool-q"
          name="q"
          defaultValue={q}
          placeholder="Search tools"
          className="h-10 w-64 rounded-md border border-input bg-card px-3 text-sm"
        />
        <label htmlFor="tool-cat" className="sr-only">
          Category
        </label>
        <select
          id="tool-cat"
          name="category"
          defaultValue={category}
          className="h-10 rounded-md border border-input bg-card px-3 text-sm"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.short}
            </option>
          ))}
        </select>
        <Button type="submit">Filter</Button>
      </form>
      <p className="mb-3 text-sm text-muted-foreground">{all.length} tools</p>
      {list.length === 0 ? (
        <EmptyState title="No tools match" />
      ) : (
        <ul className="divide-y rounded-lg border bg-card">
          {list.map((t) => {
            const o = overrides[t.slug];
            return (
              <li
                key={t.slug}
                className="flex flex-wrap items-center justify-between gap-3 p-3"
              >
                <div className="min-w-0">
                  <p className="font-medium">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.slug}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <StatusBadge
                    status={
                      runtime.liveSlugs.includes(t.slug)
                        ? "live"
                        : "coming_soon"
                    }
                  />
                  <ToolConfigRow
                    slug={t.slug}
                    enabled={o ? o.enabled : true}
                    override={o ? o.credits : null}
                    defaultCredits={t.credits}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <div className="mt-4 flex gap-2">
        {page > 1 && (
          <Button variant="outline">
            <Link href={`/admin/tools?${qs({ page: String(page - 1) })}`}>
              Previous
            </Link>
          </Button>
        )}
        {page * PAGE < all.length && (
          <Button variant="outline">
            <Link href={`/admin/tools?${qs({ page: String(page + 1) })}`}>
              Next
            </Link>
          </Button>
        )}
      </div>
    </>
  );
}
