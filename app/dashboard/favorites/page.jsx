import { PageHeader } from "@/components/dashboard/page-header";
import { ToolGrid } from "@/components/dashboard/tool-grid";
import { requireUser } from "@/lib/auth/session";
import { getFavoriteSlugs } from "@/lib/data/dashboard";
import { getToolRuntime } from "@/lib/ai/availability";

export const metadata = { title: "Favorites" };

export default async function FavoritesPage() {
  const user = await requireUser();
  const [favorites, runtime] = await Promise.all([getFavoriteSlugs(user.uid), getToolRuntime()]);
  return (
    <>
      <PageHeader title="Favorites" description="Tools you saved." />
      <ToolGrid liveSlugs={runtime.liveSlugs} creditOverrides={runtime.credits} initialFavorites={favorites} favoritesOnly />
    </>
  );
}
