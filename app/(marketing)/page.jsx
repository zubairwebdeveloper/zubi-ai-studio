import Link from "next/link";

import { HeroSearch } from "@/components/marketing/hero-search";
import { JsonLd } from "@/components/shared/json-ld";
import { MotionDiv } from "@/components/marketing/motion-wrapper";

import {
  PopularTools,
  FeaturedCategories,
  TrendingTools,
  NewTools,
  MediaShowcase,
  WorkflowShowcase,
  HowItWorks,
  Benefits,
  UseCases,
  AdvancedFeatures,
  AICapabilities,
  PricingPreview,
  Faqs,
  Newsletter,
} from "@/components/marketing/home-sections";

import {
  ArrowRight,
  ArrowUpRight,
  Sparkles,
  Zap,
  ShieldCheck,
  Image as ImageIcon,
  Video,
  FileText,
  Code2,
  WandSparkles,
  Layers3,
  Rocket,
  Globe2,
  CheckCircle2,
} from "lucide-react";

/* -------------------------------------------------------
   SEO Metadata
------------------------------------------------------- */

export const metadata = {
  title: "Zubi AI Studio - Discover Powerful AI Tools",
  description:
    "Discover powerful AI tools for image generation, video creation, writing, coding and productivity. Explore AI-powered solutions in one place.",
  keywords: [
    "AI tools",
    "AI image generator",
    "AI video generator",
    "AI writing tools",
    "AI coding tools",
    "AI productivity",
    "artificial intelligence tools",
    "Zubi AI Studio",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Zubi AI Studio - Discover Powerful AI Tools",
    description:
      "Explore AI tools for creativity, productivity, content creation and development.",
    type: "website",
    siteName: "Zubi AI Studio",
  },
  twitter: {
    card: "summary_large_image",
    title: "Zubi AI Studio - Discover Powerful AI Tools",
    description: "Discover powerful AI tools for your everyday workflow.",
  },
};

/* -------------------------------------------------------
   Homepage data
------------------------------------------------------- */

const stats = [
  {
    value: "AI",
    label: "Powered experiences",
    icon: Sparkles,
  },
  {
    value: "24/7",
    label: "Explore anytime",
    icon: Globe2,
  },
  {
    value: "All-in-One",
    label: "Tool discovery",
    icon: Layers3,
  },
  {
    value: "Easy",
    label: "To get started",
    icon: Rocket,
  },
];

const heroFeatures = [
  {
    icon: ImageIcon,
    label: "Image tools",
  },
  {
    icon: Video,
    label: "Video tools",
  },
  {
    icon: FileText,
    label: "Writing tools",
  },
  {
    icon: Code2,
    label: "Developer tools",
  },
];

const trustPoints = [
  "Discover useful AI tools",
  "Explore different categories",
  "Find tools for your workflow",
];

/* -------------------------------------------------------
   Homepage
------------------------------------------------------- */

export default function HomePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Zubi AI Studio",
    description:
      "Discover AI tools for image generation, video creation, writing, coding and productivity.",
    url: "https://zubi-ai-studio.vercel.app/",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate:
          "https://zubi-ai-studio.vercel.app/tools?search={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      {/* Structured Data */}
      <JsonLd data={jsonLd} />

      <main className="overflow-hidden">
        {/* =============================================
            HERO SECTION
        ============================================= */}

        <section className="relative isolate overflow-hidden pb-20 pt-16 sm:pb-24 sm:pt-24 lg:pb-32 lg:pt-28">
          {/* Background effects */}
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-primary/[0.08] blur-[120px]" />

            <div className="absolute -right-40 top-40 h-96 w-96 rounded-full bg-violet-500/[0.08] blur-[110px]" />

            <div className="absolute -left-40 bottom-0 h-96 w-96 rounded-full bg-blue-500/[0.06] blur-[110px]" />

            <div className="absolute inset-0 bg-[radial-gradient(hsl(var(--foreground)/0.08)_1px,transparent_1px)] [background-size:28px_28px] opacity-30" />
          </div>

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-5xl text-center">
              {/* Announcement */}
              <MotionDiv
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <Link
                  href="/tools"
                  className="group mb-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-xs font-semibold text-primary transition-all hover:border-primary/40 hover:bg-primary/10 sm:text-sm"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                  </span>
                  Explore the world of AI tools
                  <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </Link>
              </MotionDiv>

              {/* Main heading */}
              <MotionDiv
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1 }}
              >
                <h1 className="text-balance text-4xl font-black leading-[1.12] tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
                  Discover the Power of
                  <span className="mt-2 block text-primary">
                    Artificial Intelligence
                  </span>
                  <span className="mt-2 block text-foreground">
                    All in One Place.
                  </span>
                </h1>
              </MotionDiv>

              {/* Description */}
              <MotionDiv
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
              >
                <p className="mx-auto mt-7 max-w-2xl text-pretty text-base leading-8 text-muted-foreground sm:text-lg">
                  Explore powerful AI tools for image generation, video
                  creation, writing, coding and productivity. Find the right
                  tools and bring your ideas to life.
                </p>
              </MotionDiv>

              {/* Search */}
              <MotionDiv
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.3 }}
                className="mx-auto mt-10 max-w-2xl"
              >
                <HeroSearch />
              </MotionDiv>

              {/* CTA buttons */}
              <MotionDiv
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.4 }}
                className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"
              >
                <Link
                  href="/tools"
                  className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-7 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-300 hover:-translate-y-1 hover:bg-primary/90 hover:shadow-xl"
                >
                  Explore AI Tools
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>

                <Link
                  href="/categories"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-border bg-background/80 px-7 py-3 text-sm font-semibold text-foreground backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-primary hover:text-primary"
                >
                  Browse Categories
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </MotionDiv>

              {/* Trust points */}
              <MotionDiv
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.55 }}
                className="mt-9 flex flex-wrap items-center justify-center gap-x-6 gap-y-3"
              >
                {trustPoints.map((point) => (
                  <span
                    key={point}
                    className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground sm:text-sm"
                  >
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    {point}
                  </span>
                ))}
              </MotionDiv>
            </div>

            {/* Hero feature cards */}
            <MotionDiv
              initial={{ opacity: 0, y: 35 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="mx-auto mt-16 grid max-w-4xl grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4"
            >
              {heroFeatures.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.label}
                    className="group flex items-center justify-center gap-3 rounded-2xl border border-border bg-card/70 px-3 py-4 shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                      <Icon className="h-4 w-4" />
                    </div>

                    <span className="text-xs font-semibold text-foreground sm:text-sm">
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </MotionDiv>
          </div>
        </section>

        {/* =============================================
            PLATFORM STATS
        ============================================= */}

        <section className="border-y border-border bg-muted/20 py-10">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 sm:px-6 lg:grid-cols-4 lg:px-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;

              return (
                <MotionDiv
                  key={stat.label}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.08 }}
                  className="flex items-center justify-center gap-3"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="text-lg font-black tracking-tight text-foreground sm:text-xl">
                      {stat.value}
                    </p>

                    <p className="text-xs text-muted-foreground sm:text-sm">
                      {stat.label}
                    </p>
                  </div>
                </MotionDiv>
              );
            })}
          </div>
        </section>

        {/* =============================================
            POPULAR TOOLS
        ============================================= */}

        <PopularTools />

        {/* =============================================
            FEATURED CATEGORIES
        ============================================= */}

        <FeaturedCategories />

        {/* =============================================
            AI CAPABILITIES
        ============================================= */}

        <AICapabilities />

        {/* =============================================
            TRENDING TOOLS
        ============================================= */}

        <TrendingTools />

        {/* =============================================
            NEW TOOLS
        ============================================= */}

        <NewTools />

        {/* =============================================
            MEDIA SHOWCASE
        ============================================= */}

        <MediaShowcase />

        {/* =============================================
            WORKFLOW SHOWCASE
        ============================================= */}

        <WorkflowShowcase />

        {/* =============================================
            HOW IT WORKS
        ============================================= */}

        <HowItWorks />

        {/* =============================================
            BENEFITS
        ============================================= */}

        <Benefits />

        {/* =============================================
            USE CASES
        ============================================= */}

        <UseCases />

        {/* =============================================
            ADVANCED FEATURES
        ============================================= */}

        <AdvancedFeatures />

        {/* =============================================
            PRICING
        ============================================= */}

        <PricingPreview />

        {/* =============================================
            FAQS
        ============================================= */}

        <Faqs />

        {/* =============================================
            FINAL CTA
        ============================================= */}

        <section className="relative overflow-hidden border-t border-border py-20 sm:py-28">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[120px]" />
          </div>

          <div className="relative mx-auto max-w-5xl px-4 sm:px-6">
            <MotionDiv
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="relative overflow-hidden rounded-[2rem] border border-primary/20 bg-card px-6 py-14 text-center shadow-2xl shadow-primary/5 sm:px-12 sm:py-20"
            >
              <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />

              <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-violet-500/10 blur-3xl" />

              <div className="relative">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <WandSparkles className="h-8 w-8" />
                </div>

                <h2 className="mx-auto mt-7 max-w-3xl text-balance text-3xl font-black tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                  Your Next Big Idea Starts with AI.
                </h2>

                <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-muted-foreground">
                  Discover innovative AI tools, explore creative possibilities
                  and make your next project happen.
                </p>

                <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
                  <Link
                    href="/tools"
                    className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-7 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:-translate-y-1 hover:bg-primary/90"
                  >
                    Get Started
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>

                  <Link
                    href="/categories"
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-border bg-background px-7 py-3 text-sm font-semibold text-foreground transition-all hover:border-primary hover:text-primary"
                  >
                    Explore Categories
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </MotionDiv>
          </div>
        </section>

        {/* =============================================
            NEWSLETTER / FOOTER CTA
        ============================================= */}

        <Newsletter />
      </main>
    </>
  );
}
