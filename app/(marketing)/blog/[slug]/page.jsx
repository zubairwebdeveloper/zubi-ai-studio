import { notFound } from "next/navigation";
import { PageShell } from "@/components/shared/page-shell";
import { JsonLd } from "@/components/shared/json-ld";
import { posts } from "@/config/blog";
import { siteConfig } from "@/config/site";

export function generateStaticParams() {
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = posts.find((p) => p.slug === slug);
  if (!post) return {};
  return { title: post.title, description: post.description, alternates: { canonical: `/blog/${slug}` } };
}

export default async function BlogPost({ params }) {
  const { slug } = await params;
  const post = posts.find((p) => p.slug === slug);
  if (!post) notFound();
  return (
    <PageShell title={post.title} intro={post.date} narrow>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "BlogPosting", headline: post.title, datePublished: post.date,
        description: post.description, mainEntityOfPage: `${siteConfig.url}/blog/${slug}` }} />
      {post.body.map((para, i) => <p key={i}>{para}</p>)}
    </PageShell>
  );
}
