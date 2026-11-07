import { siteConfig } from "@/config/site";
import { tools } from "@/lib/tools/registry";
import { categories } from "@/config/categories";
import { posts } from "@/config/blog";

export default function sitemap() {
  const now = new Date();
  const staticPaths = ["", "/tools", "/categories", "/pricing", "/about", "/contact", "/blog", "/documentation", "/affiliate", "/privacy-policy", "/terms"];
  return [
    ...staticPaths.map((p) => ({ url: `${siteConfig.url}${p}`, lastModified: now, priority: p === "" ? 1 : 0.8 })),
    ...categories.map((c) => ({ url: `${siteConfig.url}/categories/${c.slug}`, lastModified: now, priority: 0.7 })),
    ...posts.map((p) => ({ url: `${siteConfig.url}/blog/${p.slug}`, lastModified: new Date(p.date), priority: 0.5 })),
    ...tools.map((t) => ({ url: `${siteConfig.url}/tools/${t.slug}`, lastModified: now, priority: 0.6 })),
  ];
}
