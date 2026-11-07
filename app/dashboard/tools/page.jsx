import { PageHeader } from "@/components/dashboard/page-header";
import { ToolGrid } from "@/components/dashboard/tool-grid";
import { requireUser } from "@/lib/auth/session";
import { getFavoriteSlugs } from "@/lib/data/dashboard";
import { getToolRuntime } from "@/lib/ai/availability";

export const metadata = { title: "Tools" };

export default async function DashboardToolsPage() {
  const user = await requireUser();
  const [favorites, runtime] = await Promise.all([getFavoriteSlugs(user.uid), getToolRuntime()]);
  return (
    <>
      <PageHeader title="Tools" description="Search every tool. Each card shows whether it is live and what it costs." />
      <ToolGrid liveSlugs={runtime.liveSlugs} creditOverrides={runtime.credits} initialFavorites={favorites} />
    </>
  );
}
