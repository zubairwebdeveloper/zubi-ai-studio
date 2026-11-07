// Run: npm run test:registry
import { tools, searchTools, getFeatured, getToolsByCategory } from "../lib/tools/registry.js";
import { categories } from "../config/categories.js";
import { featuredSlugs } from "../config/tool-catalog.js";

const fail = (m) => { console.error("FAIL:", m); process.exit(1); };
const slugs = tools.map((t) => t.slug);
if (new Set(slugs).size !== slugs.length) fail("duplicate slugs");
for (const [k, arr] of Object.entries(featuredSlugs)) {
  if (getFeatured(k).length !== arr.length) fail(`featured list "${k}" has unknown slugs`);
}
for (const c of categories) if (!getToolsByCategory(c.id).length) fail(`empty category ${c.id}`);
if (tools.some((t) => t.status === "live" && !t.providerMappings.length)) fail("live tool without provider");
if (!searchTools("background").some((t) => t.slug === "ai-background-remover")) fail("search broken");
const multi = tools.filter((t) => t.categories.length > 1).map((t) => `${t.name} [${t.categories.join(", ")}]`);
console.log(`OK: ${categories.length} categories, ${tools.length} unique tools`);
console.log("Tools in multiple categories:\n  " + multi.join("\n  "));
