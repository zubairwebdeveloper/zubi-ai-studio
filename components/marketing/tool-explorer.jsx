"use client";

import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import {
  Search,
  X,
  Heart,
  Sparkles,
  Clock3,
  ArrowUpDown,
  RotateCcw,
  ChevronDown,
  WandSparkles,
  Layers3,
  Command,
  SlidersHorizontal,
  ArrowRight,
  Grid3X3,
  Stars,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { ToolCard } from "@/components/shared/tool-card";

import { categories } from "@/config/categories";
import { tools, searchTools, getTool } from "@/lib/tools/registry";

import { useLocalList } from "@/hooks/use-local-list";
import { cn } from "@/lib/utils";

const PAGE = 24;

const sortOptions = [
  { value: "relevance", label: "Best match" },
  { value: "name", label: "Name: A to Z" },
  { value: "credits-asc", label: "Credits: Low to High" },
  { value: "credits-desc", label: "Credits: High to Low" },
];

const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.045,
    },
  },
};

const fadeUp = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut",
    },
  },
};

export function ToolExplorer() {
  const params = useSearchParams();
  const shouldReduceMotion = useReducedMotion();

  const [q, setQ] = useState(params.get("q") || "");
  const [category, setCategory] = useState(params.get("category") || "");

  const [sort, setSort] = useState("relevance");
  const [onlyFav, setOnlyFav] = useState(false);
  const [shown, setShown] = useState(PAGE);

  const favs = useLocalList("ai-studio:favorites");
  const recent = useLocalList("ai-studio:recent", 12);

  const motionProps = shouldReduceMotion
    ? {
        initial: false,
        animate: { opacity: 1 },
        transition: { duration: 0 },
      }
    : {};

  useEffect(() => {
    setQ(params.get("q") || "");
    setCategory(params.get("category") || "");
    setShown(PAGE);
  }, [params]);

  useEffect(() => {
    setShown(PAGE);
  }, [q, category, sort, onlyFav]);

  const list = useMemo(() => {
    let result = searchTools(q, {
      category: category || undefined,
      sort,
    });

    if (onlyFav) {
      result = result.filter((tool) => favs.items.includes(tool.slug));
    }

    return result;
  }, [q, category, sort, onlyFav, favs.items]);

  const recentTools = useMemo(
    () => recent.items.map(getTool).filter(Boolean).slice(0, 4),
    [recent.items],
  );

  const categoryCounts = useMemo(
    () =>
      categories.map((item) => ({
        ...item,
        count: searchTools("", {
          category: item.id,
        }).length,
      })),
    [],
  );

  const totalFavorites = favs.items.length;

  const activeCategory = categories.find((item) => item.id === category);

  const hasFilters = Boolean(
    q.trim() || category || onlyFav || sort !== "relevance",
  );

  const clearFilters = () => {
    setQ("");
    setCategory("");
    setOnlyFav(false);
    setSort("relevance");
    setShown(PAGE);
  };

  const visibleTools = list.slice(0, shown);
  const progress = list.length ? (visibleTools.length / list.length) * 100 : 0;

  return (
    <div className="space-y-10">
      {/* HERO SECTION */}
      <section className="group relative isolate overflow-hidden rounded-3xl border bg-card">
        {/* Background decoration */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <motion.div
            animate={
              shouldReduceMotion
                ? {}
                : {
                    x: [0, 30, 0],
                    y: [0, -20, 0],
                  }
            }
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute -right-24 -top-28 h-80 w-80 rounded-full bg-primary/10 blur-[90px]"
          />

          <motion.div
            animate={
              shouldReduceMotion
                ? {}
                : {
                    x: [0, -25, 0],
                    y: [0, 20, 0],
                  }
            }
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute -bottom-32 left-1/4 h-72 w-72 rounded-full bg-primary/5 blur-[90px]"
          />

          <div className="absolute inset-0 bg-[radial-gradient(hsl(var(--foreground)/0.08)_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />
        </div>

        <div className="relative z-10 grid gap-10 p-6 sm:p-9 lg:grid-cols-[1fr_auto] lg:items-center lg:p-12">
          <div className="max-w-3xl">
            <motion.div
              {...motionProps}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border bg-background/80 px-3 py-1.5 text-xs font-semibold text-primary shadow-sm backdrop-blur"
            >
              <Sparkles className="h-3.5 w-3.5" />
              YOUR AI CREATION WORKSPACE
              <Badge variant="secondary" className="ml-1 text-[9px]">
                EXPLORE
              </Badge>
            </motion.div>

            <motion.h1
              initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.08 }}
              className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl"
            >
              Discover tools.
              <br />
              <span className="relative inline-block text-primary">
                Create without limits.
                <motion.span
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{
                    duration: 0.8,
                    delay: 0.65,
                    ease: "easeOut",
                  }}
                  className="absolute -bottom-1 left-0 h-1 w-full origin-left rounded-full bg-primary/30"
                />
              </span>
            </motion.h1>

            <motion.p
              initial={shouldReduceMotion ? false : { opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="mt-5 max-w-xl text-sm leading-7 text-muted-foreground sm:text-base"
            >
              Explore powerful AI tools for images, videos, writing, coding,
              audio and business. Find the right tools to turn your ideas into
              reality.
            </motion.p>

            {/* SEARCH BAR */}
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.22 }}
              className="mt-8"
            >
              <div className="group/search relative flex items-center gap-2 rounded-2xl border bg-background p-2 shadow-lg shadow-black/[0.03] transition-all duration-300 hover:border-primary/40 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10">
                <Search className="ml-3 h-5 w-5 shrink-0 text-muted-foreground transition-colors group-focus-within/search:text-primary" />

                <label htmlFor="tool-q" className="sr-only">
                  Search AI tools
                </label>

                <Input
                  id="tool-q"
                  value={q}
                  onChange={(event) => setQ(event.target.value)}
                  placeholder="Search AI tools, image generator, video..."
                  className="h-11 border-0 bg-transparent shadow-none focus-visible:ring-0"
                />

                <AnimatePresence>
                  {q && (
                    <motion.button
                      type="button"
                      initial={{ opacity: 0, scale: 0.7 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.7 }}
                      onClick={() => setQ("")}
                      aria-label="Clear search"
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </motion.button>
                  )}
                </AnimatePresence>

                <div className="hidden shrink-0 items-center gap-1 rounded-lg border bg-muted/50 px-2 py-1.5 text-[10px] font-medium text-muted-foreground sm:flex">
                  <Command className="h-3 w-3" />
                  SEARCH
                </div>
              </div>

              <p className="mt-3 text-xs text-muted-foreground">
                Try: Image Generator, AI Writer, Video Creator, Code Assistant
              </p>
            </motion.div>

            {/* STATS */}
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-8 flex flex-wrap gap-x-7 gap-y-4"
            >
              {[
                {
                  icon: Layers3,
                  value: tools.length,
                  label: "AI Tools",
                },
                {
                  icon: Grid3X3,
                  value: categories.length,
                  label: "Categories",
                },
                {
                  icon: Heart,
                  value: totalFavorites,
                  label: "Favorites",
                },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <stat.icon className="h-4 w-4" />
                  </div>

                  <div>
                    <p className="text-sm font-bold text-foreground">
                      {stat.value}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {stat.label}
                    </p>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Decorative visual */}
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="relative hidden h-64 w-64 items-center justify-center lg:flex"
          >
            <motion.div
              animate={shouldReduceMotion ? {} : { rotate: 360 }}
              transition={{
                duration: 35,
                repeat: Infinity,
                ease: "linear",
              }}
              className="absolute inset-2 rounded-full border border-dashed border-primary/30"
            />

            <motion.div
              animate={
                shouldReduceMotion
                  ? {}
                  : {
                      y: [0, -12, 0],
                      rotate: [0, 5, 0],
                    }
              }
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="relative flex h-32 w-32 items-center justify-center rounded-[2rem] border bg-background shadow-2xl shadow-primary/10"
            >
              <div className="absolute inset-2 rounded-[1.5rem] bg-primary/5" />
              <WandSparkles className="relative h-14 w-14 text-primary" />
            </motion.div>

            <motion.div
              animate={shouldReduceMotion ? {} : { y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="absolute right-1 top-10 flex h-12 w-12 items-center justify-center rounded-2xl border bg-background shadow-lg"
            >
              <Stars className="h-5 w-5 text-primary" />
            </motion.div>

            <motion.div
              animate={shouldReduceMotion ? {} : { y: [0, 8, 0] }}
              transition={{ duration: 4.5, repeat: Infinity }}
              className="absolute bottom-9 left-0 flex h-12 w-12 items-center justify-center rounded-2xl border bg-background shadow-lg"
            >
              <Sparkles className="h-5 w-5 text-primary" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CATEGORY SECTION */}
      <section className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="mb-2 flex items-center gap-2 text-primary">
              <Grid3X3 className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-widest">
                Discover
              </span>
            </div>

            <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
              Browse categories
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Explore tools by your creative needs.
            </p>
          </div>

          {category && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCategory("")}
              className="gap-1 text-primary"
            >
              Clear category
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {/* ALL CATEGORY */}
          <motion.button
            type="button"
            whileHover={shouldReduceMotion ? {} : { y: -2 }}
            whileTap={shouldReduceMotion ? {} : { scale: 0.97 }}
            onClick={() => setCategory("")}
            aria-pressed={!category}
            className={cn(
              "relative flex items-center gap-2 overflow-hidden rounded-xl border px-4 py-3 text-sm font-semibold transition-colors duration-300",
              !category
                ? "border-primary/40 bg-primary/10 text-primary"
                : "bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
            )}
          >
            <Layers3 className="h-4 w-4" />
            All Tools
            <Badge variant="secondary" className="text-[10px]">
              {tools.length}
            </Badge>
            {!category && (
              <motion.span
                layoutId="category-underline"
                className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-primary"
                transition={{
                  type: "spring",
                  stiffness: 380,
                  damping: 30,
                }}
              />
            )}
          </motion.button>

          {categoryCounts.map((item) => {
            const active = category === item.id;

            return (
              <motion.button
                key={item.id}
                type="button"
                whileHover={shouldReduceMotion ? {} : { y: -2 }}
                whileTap={shouldReduceMotion ? {} : { scale: 0.97 }}
                onClick={() => setCategory(item.id)}
                aria-pressed={active}
                className={cn(
                  "relative flex items-center gap-2 overflow-hidden rounded-xl border px-4 py-3 text-sm font-semibold transition-colors duration-300",
                  active
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
                )}
              >
                {item.short}

                <Badge variant="secondary" className="text-[10px]">
                  {item.count}
                </Badge>

                {active && (
                  <motion.span
                    layoutId="category-underline"
                    className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-primary"
                    transition={{
                      type: "spring",
                      stiffness: 380,
                      damping: 30,
                    }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </section>

      {/* RECENTLY VIEWED */}
      {recentTools.length > 0 && !q && !category && !onlyFav && (
        <motion.section
          {...motionProps}
          initial={shouldReduceMotion ? false : { opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-5"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-primary" />
                <h2 className="text-lg font-bold">Recently viewed</h2>
              </div>

              <p className="mt-1 text-sm text-muted-foreground">
                Pick up where you left off.
              </p>
            </div>
          </div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            {recentTools.map((tool) => (
              <motion.div
                key={tool.slug}
                variants={fadeUp}
                whileHover={shouldReduceMotion ? {} : { y: -5 }}
              >
                <ToolCard
                  tool={tool}
                  isFavorite={favs.has(tool.slug)}
                  onToggleFavorite={favs.toggle}
                />
              </motion.div>
            ))}
          </motion.div>
        </motion.section>
      )}

      {/* RESULTS SECTION */}
      <section className="space-y-6">
        {/* Results Heading */}
        <div className="flex flex-col justify-between gap-4 border-b pb-5 sm:flex-row sm:items-end">
          <div>
            <div className="mb-2 flex items-center gap-2 text-primary">
              <SlidersHorizontal className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-widest">
                Tool library
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
                {onlyFav
                  ? "Your favorites"
                  : activeCategory
                    ? `${activeCategory.short} tools`
                    : "Explore all tools"}
              </h2>

              {onlyFav && (
                <Badge variant="secondary">
                  <Heart className="mr-1 h-3 w-3 fill-current" />
                  Saved
                </Badge>
              )}
            </div>

            <p className="mt-1 text-sm text-muted-foreground">
              Showing {list.length} matching{" "}
              {list.length === 1 ? "tool" : "tools"}
              {q.trim() ? ` for "${q.trim()}"` : ""}
            </p>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant={onlyFav ? "default" : "outline"}
              aria-pressed={onlyFav}
              onClick={() => setOnlyFav((value) => !value)}
              className="gap-2"
            >
              <motion.span
                animate={
                  onlyFav && !shouldReduceMotion ? { scale: [1, 1.25, 1] } : {}
                }
              >
                <Heart className={cn("h-4 w-4", onlyFav && "fill-current")} />
              </motion.span>
              Favorites
              <Badge
                variant={onlyFav ? "secondary" : "outline"}
                className="h-5 px-1.5 text-[10px]"
              >
                {totalFavorites}
              </Badge>
            </Button>

            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="h-9 w-[190px] gap-2">
                <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                <SelectValue placeholder="Sort tools" />
              </SelectTrigger>

              <SelectContent align="end">
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ACTIVE FILTERS */}
        <AnimatePresence>
          {hasFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-wrap items-center gap-2 overflow-hidden"
            >
              <span className="text-xs font-medium text-muted-foreground">
                Active filters:
              </span>

              {q.trim() && (
                <Badge variant="secondary" className="gap-1 rounded-full py-1">
                  Search: {q}
                  <button
                    type="button"
                    aria-label="Remove search filter"
                    onClick={() => setQ("")}
                    className="ml-1 rounded-full hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}

              {activeCategory && (
                <Badge variant="secondary" className="gap-1 rounded-full py-1">
                  {activeCategory.short}

                  <button
                    type="button"
                    aria-label="Remove category filter"
                    onClick={() => setCategory("")}
                    className="ml-1 rounded-full hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}

              {onlyFav && (
                <Badge variant="secondary" className="gap-1 rounded-full py-1">
                  Favorites
                  <button
                    type="button"
                    aria-label="Remove favorites filter"
                    onClick={() => setOnlyFav(false)}
                    className="ml-1 rounded-full hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}

              {sort !== "relevance" && (
                <Badge variant="secondary" className="rounded-full">
                  {sortOptions.find((item) => item.value === sort)?.label}
                </Badge>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-7 gap-1 px-2 text-xs text-primary hover:text-primary"
              >
                <RotateCcw className="h-3 w-3" />
                Reset all
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* TOOL RESULTS */}
        <AnimatePresence mode="wait">
          {list.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Card className="border-dashed bg-muted/20 shadow-none">
                <CardContent className="flex flex-col items-center px-5 py-16 text-center">
                  <motion.div
                    animate={
                      shouldReduceMotion ? {} : { rotate: [0, -8, 8, 0] }
                    }
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 2,
                    }}
                    className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary"
                  >
                    {onlyFav && !totalFavorites ? (
                      <Heart className="h-7 w-7" />
                    ) : (
                      <Search className="h-7 w-7" />
                    )}
                  </motion.div>

                  <h3 className="mt-5 text-xl font-bold">
                    {onlyFav && !totalFavorites
                      ? "No favorites yet"
                      : "No tools found"}
                  </h3>

                  <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
                    {onlyFav && !totalFavorites
                      ? "Save your favorite AI tools by clicking the heart icon on any tool card."
                      : "We couldn't find tools matching your search. Try another keyword or change your filters."}
                  </p>

                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    className="mt-6 gap-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reset filters
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key={`${q}-${category}-${sort}-${onlyFav}`}
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            >
              {visibleTools.map((tool) => (
                <motion.div
                  key={tool.slug}
                  variants={fadeUp}
                  whileHover={
                    shouldReduceMotion
                      ? {}
                      : {
                          y: -6,
                          transition: { duration: 0.2 },
                        }
                  }
                  className="min-w-0"
                >
                  <ToolCard
                    tool={tool}
                    isFavorite={favs.has(tool.slug)}
                    onToggleFavorite={favs.toggle}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* PAGINATION */}
        {list.length > 0 && (
          <div className="flex flex-col items-center gap-4 border-t pt-7">
            <div className="w-full max-w-xs space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  Showing {visibleTools.length} of {list.length}
                </span>

                <span>{Math.round(progress)}%</span>
              </div>

              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <motion.div
                  initial={false}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.4 }}
                  className="h-full rounded-full bg-primary"
                />
              </div>
            </div>

            {shown < list.length ? (
              <Button
                variant="outline"
                onClick={() => setShown((current) => current + PAGE)}
                className="group gap-2 px-7 transition-all hover:border-primary hover:text-primary"
              >
                Show more tools
                <ChevronDown className="h-4 w-4 transition-transform group-hover:translate-y-1" />
              </Button>
            ) : (
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                You've explored all available tools.
              </p>
            )}
          </div>
        )}
      </section>

      {/* BOTTOM CTA */}
      <motion.section
        initial={shouldReduceMotion ? false : { opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="group relative overflow-hidden border-primary/15 bg-primary/[0.035] shadow-none">
          <CardContent className="flex flex-col justify-between gap-5 p-6 sm:flex-row sm:items-center sm:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110">
                <WandSparkles className="h-6 w-6" />
              </div>

              <div>
                <h3 className="text-lg font-bold">
                  Your next big idea starts here.
                </h3>

                <p className="mt-1 max-w-lg text-sm leading-6 text-muted-foreground">
                  Explore different AI tools, experiment with your ideas and
                  discover new ways to create.
                </p>
              </div>
            </div>

            <Button
              variant="default"
              className="group/button shrink-0 gap-2"
              onClick={clearFilters}
            >
              Explore all tools
              <ArrowRight className="h-4 w-4 transition-transform group-hover/button:translate-x-1" />
            </Button>
          </CardContent>
        </Card>
      </motion.section>
    </div>
  );
}

export default ToolExplorer;
