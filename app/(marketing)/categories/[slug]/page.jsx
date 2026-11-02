import { notFound } from "next/navigation";
import { ToolCard } from "@/components/shared/tool-card";
import { categories } from "@/config/categories";
import { getCategory, getToolsByCategory } from "@/lib/tools/registry";

export function generateStaticParams() {
  return categories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const c = getCategory(slug);
  if (!c) return {};
  return { title: c.name, description: c.description, alternates: { canonical: `/categories/${slug}` } };
}

export default async function CategoryPage({ params }) {
  const { slug } = await params;
  const c = getCategory(slug);
  if (!c) notFound();
  const list = getToolsByCategory(c.id);
  return (
    <div className="container py-12">
      <h1 className="text-3xl font-bold md:text-4xl">{c.name}</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">{c.description}</p>
      <p className="mt-6 text-sm text-muted-foreground">{list.length} tools</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {list.map((t) => <ToolCard key={t.slug} tool={t} />)}
      </div>
    </div>
  );
}
