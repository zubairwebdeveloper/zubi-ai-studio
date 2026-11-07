import Link from "next/link";
import { PageShell } from "@/components/shared/page-shell";
import { posts } from "@/config/blog";

export const metadata = {
  title: "Blog",
  description: "Guides and product updates from AI Studio.",
  alternates: { canonical: "/blog" },
};

export default function BlogPage() {
  return (
    <PageShell title="Blog" intro="Guides and product updates.">
      {posts.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <p className="font-medium">No posts yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Guides and release notes will be published here.</p>
        </div>
      ) : (
        <ul className="divide-y rounded-lg border bg-card">
          {[...posts].sort((a, b) => b.date.localeCompare(a.date)).map((p) => (
            <li key={p.slug} className="p-5">
              <Link href={`/blog/${p.slug}`} className="text-lg font-semibold hover:text-primary">{p.title}</Link>
              <p className="mt-1 text-sm text-muted-foreground">{p.date}</p>
              <p className="mt-2 text-muted-foreground">{p.description}</p>
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}
