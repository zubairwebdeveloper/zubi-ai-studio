import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { ToolCard } from "@/components/shared/tool-card";
import { JsonLd } from "@/components/shared/json-ld";
import { RecordView } from "@/components/marketing/record-view";
import { siteConfig } from "@/config/site";
import {
  tools,
  getTool,
  getCategoryById,
  getRelatedTools,
} from "@/lib/tools/registry";

export function generateStaticParams() {
  return tools.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const tool = getTool(slug);
  if (!tool) return {};
  const cat = getCategoryById(tool.category);
  const title = `${tool.name}${tool.status === "live" ? "" : " (coming soon)"}`;
  const description = `${tool.name} in ${cat.name}. ${tool.credits} credits per run. ${cat.description}`;
  return {
    title,
    description,
    alternates: { canonical: `/tools/${slug}` },
    openGraph: { title, description, url: `${siteConfig.url}/tools/${slug}` },
  };
}

export default async function ToolPage({ params }) {
  const { slug } = await params;
  const tool = getTool(slug);
  if (!tool) notFound();
  const cat = getCategoryById(tool.category);
  const related = getRelatedTools(tool);

  return (
    <div className="container py-12">
      <RecordView slug={tool.slug} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: tool.name,
          applicationCategory: "MultimediaApplication",
          operatingSystem: "Web",
          url: `${siteConfig.url}/tools/${tool.slug}`,
          description: cat.description,
        }}
      />
      <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
        <Link href="/tools" className="hover:text-foreground">
          Tools
        </Link>{" "}
        /{" "}
        <Link
          href={`/categories/${cat.slug}`}
          className="hover:text-foreground"
        >
          {cat.short}
        </Link>
      </nav>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <StatusBadge status={tool.status} />
        <Badge variant="credit">{tool.credits} credits per run</Badge>
      </div>
      <h1 className="mt-3 max-w-3xl text-4xl font-bold md:text-5xl">
        {tool.name}
      </h1>
      <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
        {cat.description}
      </p>

      {tool.safeguard && (
        <div
          role="note"
          className="mt-6 max-w-2xl rounded-lg border border-credit/50 bg-credit/10 p-4 text-sm"
        >
          <strong>Usage rule:</strong> {tool.safeguard}
        </div>
      )}

      <div className="mt-8 max-w-2xl rounded-lg border bg-card p-6">
        {tool.status === "live" ? (
          <Button size="lg">
            <Link href="/register">Use this tool</Link>
          </Button>
        ) : (
          <>
            <p className="font-medium">This tool is not available yet.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              No AI provider is connected for it. It will go live once a
              provider is configured and tested.
            </p>
            <Button className="mt-4" variant="outline">
              <Link href="/tools">Browse available tools</Link>
            </Button>
          </>
        )}
      </div>

      {related.length > 0 && (
        <section className="mt-14" aria-labelledby="rel-h">
          <h2 id="rel-h" className="mb-4 text-xl font-semibold">
            More in {cat.short}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((t) => (
              <ToolCard key={t.slug} tool={t} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
