"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { searchTools, getCategoryById } from "@/lib/tools/registry";

// Works without JS (plain GET form to /tools?q=). With JS it shows live matches from the registry.
export function HeroSearch() {
  const [q, setQ] = useState("");
  const results = useMemo(() => (q.trim() ? searchTools(q).slice(0, 6) : []), [q]);
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-2xl">
      <form action="/tools" method="get" role="search" className="flex gap-2 rounded-lg border bg-card p-2 shadow-sm">
        <label htmlFor="hero-q" className="sr-only">Search AI tools</label>
        <Search className="ml-2 mt-3 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <input
          id="hero-q" name="q" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off"
          placeholder="Try “remove background” or “summarize PDF”"
          className="h-11 w-full bg-transparent px-1 text-base placeholder:text-muted-foreground"
        />
        <Button type="submit" size="lg">Search</Button>
      </form>
      {q.trim() && (
        <div className="mt-2 rounded-lg border bg-card p-1" aria-live="polite">
          {results.length === 0 ? (
            <p className="p-3 text-sm text-muted-foreground">No tools match “{q}”. Try a broader word like “image” or “video”.</p>
          ) : (
            <ul>
              {results.map((t) => (
                <li key={t.slug}>
                  <Link href={`/tools/${t.slug}`} className="flex items-center justify-between gap-3 rounded-md px-3 py-2 hover:bg-muted">
                    <span className="font-medium">{t.name}</span>
                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                      {getCategoryById(t.category)?.short}
                      <StatusBadge status={t.status} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </motion.div>
  );
}
