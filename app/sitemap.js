import { siteConfig } from "@/config/site";
import { tools } from "@/lib/tools/registry";
import { categories } from "@/config/categories";

export default function sitemap() {
  const now = new Date();
  const staticPaths = ["", "/tools", "/categories", "/pricing"];
  return [
    ...staticPaths.map((p) => ({ url: `${siteConfig.url}${p}`, lastModified: now, priority: p === "" ? 1 : 0.8 })),
    ...categories.map((c) => ({ url: `${siteConfig.url}/categories/${c.slug}`, lastModified: now, priority: 0.7 })),
    ...tools.map((t) => ({ url: `${siteConfig.url}/tools/${t.slug}`, lastModified: now, priority: 0.6 })),
  ];
}
