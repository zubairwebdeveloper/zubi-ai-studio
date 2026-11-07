"use client";
import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ToolCard } from "@/components/shared/tool-card";
import { EmptyState } from "@/components/dashboard/page-header";
import { FormAlert } from "@/components/auth/field";
import { categories } from "@/config/categories";
import { searchTools } from "@/lib/tools/registry";
import { toggleFavorite, importLocalFavorites } from "@/lib/actions/favorites";
import { cn } from "@/lib/utils";

const PAGE = 24;

export function ToolGrid({
  initialFavorites,
  favoritesOnly = false,
  liveSlugs = [],
  creditOverrides = {},
}) {
  const [favs, setFavs] = useState(initialFavorites);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [shown, setShown] = useState(PAGE);
  const [error, setError] = useState("");
  const [, startTransition] = useTransition();

  // Move favorites saved in the browser (public site) into the account, once.
  useEffect(() => {
    let local = [];
    try {
      local = JSON.parse(localStorage.getItem("ai-studio:favorites")) || [];
    } catch {}
    if (!Array.isArray(local) || !local.length) return;
    importLocalFavorites(local).then((res) => {
      if (res.ok) {
        setFavs((f) => [...new Set([...f, ...res.imported])]);
        try {
          localStorage.removeItem("ai-studio:favorites");
        } catch {}
      }
    });
  }, []);

  const list = useMemo(() => {
    const l = searchTools(q, { category: category || undefined });
    return favoritesOnly ? l.filter((t) => favs.includes(t.slug)) : l;
  }, [q, category, favs, favoritesOnly]);

  function onToggle(slug) {
    setError("");
    const wasFav = favs.includes(slug);
    setFavs((f) => (wasFav ? f.filter((s) => s !== slug) : [slug, ...f])); // optimistic
    startTransition(async () => {
      const res = await toggleFavorite(slug);
      if (!res.ok) {
        setFavs((f) => (wasFav ? [slug, ...f] : f.filter((s) => s !== slug))); // revert
        setError(res.error || "Could not update favorites.");
      }
    });
  }

  const noFavs = favoritesOnly && favs.length === 0;

  return (
    <div>
      {!noFavs && (
        <>
          <label htmlFor="dash-q" className="sr-only">
            Search tools
          </label>
          <Input
            id="dash-q"
            value={q}
            placeholder="Search tools"
            onChange={(e) => {
              setQ(e.target.value);
              setShown(PAGE);
            }}
          />
          <div
            className="mt-3 flex flex-wrap gap-2"
            role="group"
            aria-label="Filter by category"
          >
            {[{ id: "", short: "All" }, ...categories].map((c) => (
              <button
                key={c.id}
                type="button"
                aria-pressed={category === c.id}
                onClick={() => {
                  setCategory(c.id);
                  setShown(PAGE);
                }}
                className={cn(
                  "rounded-full border px-3 py-1 text-sm",
                  category === c.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "hover:bg-muted",
                )}
              >
                {c.short}
              </button>
            ))}
          </div>
        </>
      )}
      <div className="mt-3">
        <FormAlert>{error}</FormAlert>
      </div>

      {noFavs ? (
        <EmptyState
          title="No favorites yet"
          action={
            <Button>
              <Link href="/dashboard/tools">Browse tools</Link>
            </Button>
          }
        >
          Tap the heart on any tool to keep it here.
        </EmptyState>
      ) : list.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="No tools match"
            action={
              <Button
                variant="outline"
                onClick={() => {
                  setQ("");
                  setCategory("");
                }}
              >
                Reset filters
              </Button>
            }
          >
            Try a broader search or another category.
          </EmptyState>
        </div>
      ) : (
        <>
          <p className="mt-4 text-sm text-muted-foreground" aria-live="polite">
            {list.length} tools
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {list.slice(0, shown).map((t) => {
              const live = liveSlugs.includes(t.slug);
              return (
                <ToolCard
                  key={t.slug}
                  tool={{
                    ...t,
                    ...(live ? { status: "live" } : {}),
                    credits: creditOverrides[t.slug] ?? t.credits,
                  }}
                  href={`/dashboard/tools/${t.slug}`}
                  isFavorite={favs.includes(t.slug)}
                  onToggleFavorite={onToggle}
                />
              );
            })}
          </div>
          {shown < list.length && (
            <div className="mt-6 text-center">
              <Button
                variant="outline"
                onClick={() => setShown((s) => s + PAGE)}
              >
                Show more
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
