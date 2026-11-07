import { categories } from "../../config/categories.js";
import { toolCatalog, featuredSlugs, sensitiveSlugs } from "../../config/tool-catalog.js";

export function slugify(name) {
  return name.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function buildTools() {
  const bySlug = new Map();
  for (const category of categories) {
    for (const name of toolCatalog[category.id] || []) {
      const slug = slugify(name);
      const existing = bySlug.get(slug);
      if (existing) {
        if (!existing.categories.includes(category.id)) existing.categories.push(category.id);
        continue;
      }
      bySlug.set(slug, {
        slug,
        name,
        category: category.id, // primary category
        categories: [category.id],
        summary: `${name} in the ${category.short} studio.`,
        credits: category.baseCredits, // default only; admin config overrides in Phase 11
        // Empty until Phase 4. A tool only goes live when a configured provider is mapped to it.
        providerMappings: [],
        status: "coming_soon",
        safeguard: sensitiveSlugs[slug] || null,
        flags: {
          popular: featuredSlugs.popular.includes(slug),
          trending: featuredSlugs.trending.includes(slug),
          new: featuredSlugs.new.includes(slug),
        },
      });
    }
  }
  return [...bySlug.values()];
}

export const tools = buildTools();

export const getTool = (slug) => tools.find((t) => t.slug === slug) || null;
export const getCategory = (slug) => categories.find((c) => c.slug === slug) || null;
export const getCategoryById = (id) => categories.find((c) => c.id === id) || null;
export const getToolsByCategory = (id) => tools.filter((t) => t.categories.includes(id));
export const getFeatured = (key) => featuredSlugs[key].map(getTool).filter(Boolean);
export const getRelatedTools = (tool, limit = 4) =>
  getToolsByCategory(tool.category).filter((t) => t.slug !== tool.slug).slice(0, limit);

export function searchTools(query, { category, sort = "relevance" } = {}) {
  const q = (query || "").trim().toLowerCase();
  let list = tools.filter((t) => (category ? t.categories.includes(category) : true));
  if (q) {
    const words = q.split(/\s+/);
    list = list
      .map((t) => {
        const name = t.name.toLowerCase();
        const hay = `${name} ${t.summary.toLowerCase()} ${t.categories.join(" ")}`;
        if (!words.every((w) => hay.includes(w))) return null;
        const score = (name.startsWith(q) ? 3 : 0) + (name.includes(q) ? 2 : 0) + 1;
        return { t, score };
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score)
      .map((x) => x.t);
  }
  if (sort === "name") list = [...list].sort((a, b) => a.name.localeCompare(b.name));
  if (sort === "credits-asc") list = [...list].sort((a, b) => a.credits - b.credits);
  if (sort === "credits-desc") list = [...list].sort((a, b) => b.credits - a.credits);
  return list;
}
