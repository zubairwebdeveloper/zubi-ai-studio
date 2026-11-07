"use client";

import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Sparkles,
  Zap,
  ShieldCheck,
  Clock3,
  WandSparkles,
  Image as ImageIcon,
  Video,
  FileText,
  Code2,
  Layers3,
  BrainCircuit,
  Workflow,
  Check,
  ChevronDown,
  Play,
  Rocket,
  Gauge,
  LockKeyhole,
  RefreshCw,
  MousePointerClick,
  Globe2,
  Heart,
  Star,
  Send,
  Bot,
  Cpu,
  Cloud,
  Search,
  CircleCheck,
  Lightbulb,
  Palette,
  Wand2,
  MonitorSmartphone,
} from "lucide-react";

import { MotionDiv } from "@/components/marketing/motion-wrapper";
import { Button } from "@/components/ui/button";
import { ToolCard } from "@/components/tools/tool-card";
import { CategoryIcon } from "@/components/categories/category-icon";

import { categories, plans, faqs } from "@/config/site";
import { getFeatured, getTool } from "@/lib/tools/registry";

/* -------------------------------------------------------
   Animation presets
------------------------------------------------------- */

const fadeUp = {
  hidden: {
    opacity: 0,
    y: 28,
  },
  visible: {
    opacity: 1,
    y: 0,
  },
};

const fadeIn = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
  },
};

const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.09,
    },
  },
};

const viewportSettings = {
  once: true,
  amount: 0.15,
};

const cardTransition = {
  duration: 0.55,
  ease: [0.22, 1, 0.36, 1],
};

/* -------------------------------------------------------
   Shared section components
------------------------------------------------------- */

function Section({
  id,
  eyebrow,
  title,
  description,
  children,
  className = "",
  contentClassName = "",
  centered = true,
}) {
  return (
    <section
      id={id}
      aria-labelledby={id ? `${id}-heading` : undefined}
      className={`relative py-20 sm:py-24 lg:py-28 ${className}`}
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {(eyebrow || title || description) && (
          <MotionDiv
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={viewportSettings}
            transition={cardTransition}
            className={`mb-12 ${
              centered ? "mx-auto max-w-3xl text-center" : "max-w-3xl text-left"
            }`}
          >
            {eyebrow && (
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                {eyebrow}
              </div>
            )}

            {title && (
              <h2
                id={id ? `${id}-heading` : undefined}
                className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl"
              >
                {title}
              </h2>
            )}

            {description && (
              <p className="mx-auto mt-5 max-w-2xl text-pretty text-base leading-8 text-muted-foreground sm:text-lg">
                {description}
              </p>
            )}
          </MotionDiv>
        )}

        <div className={contentClassName}>{children}</div>
      </div>
    </section>
  );
}

function ArrowLink({ href, children, className = "" }) {
  return (
    <Link
      href={href}
      className={`group inline-flex items-center gap-2 text-sm font-semibold text-primary transition-colors hover:text-primary/75 ${className}`}
    >
      {children}
      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
    </Link>
  );
}

function HoverArrow() {
  return (
    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background transition-all duration-300 group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground">
      <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:rotate-45" />
    </span>
  );
}

function AnimatedIcon({
  icon: Icon,
  className = "",
  iconClassName = "h-6 w-6",
}) {
  return (
    <div
      className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10 text-primary transition-all duration-300 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground ${className}`}
    >
      <Icon className={iconClassName} />
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description, number }) {
  return (
    <MotionDiv
      variants={fadeUp}
      transition={cardTransition}
      className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5"
    >
      {number && (
        <span className="absolute right-5 top-5 text-xs font-bold tracking-widest text-muted-foreground/50">
          {number}
        </span>
      )}

      <AnimatedIcon icon={Icon} />

      <h3 className="mt-6 text-lg font-bold text-foreground">{title}</h3>

      <p className="mt-3 text-sm leading-7 text-muted-foreground">
        {description}
      </p>

      <div className="absolute -bottom-12 -right-12 h-32 w-32 rounded-full bg-primary/5 blur-2xl transition-all duration-500 group-hover:bg-primary/15" />
    </MotionDiv>
  );
}

/* -------------------------------------------------------
   Platform introduction
------------------------------------------------------- */

export function PlatformIntro() {
  return (
    <Section
      id="platform-intro"
      eyebrow="One platform, endless possibilities"
      title="Everything you need to create with AI"
      description="Explore a growing collection of AI-powered tools designed to make your creative and productivity workflows simpler."
    >
      <div className="grid gap-5 md:grid-cols-3">
        <FeatureCard
          icon={WandSparkles}
          number="01"
          title="Create with AI"
          description="Turn your ideas into useful content, images and creative results with AI-powered workflows."
        />

        <FeatureCard
          icon={Zap}
          number="02"
          title="Work faster"
          description="Spend less time on repetitive tasks and focus more on the work that matters."
        />

        <FeatureCard
          icon={Layers3}
          number="03"
          title="One connected workspace"
          description="Discover different creative and productivity tools from one convenient platform."
        />
      </div>
    </Section>
  );
}

/* -------------------------------------------------------
   Platform highlights
------------------------------------------------------- */

export function PlatformHighlights() {
  const highlights = [
    {
      icon: Sparkles,
      title: "AI-powered experience",
      description: "Discover intelligent tools for everyday creative tasks.",
    },
    {
      icon: Gauge,
      title: "Simple workflows",
      description: "Get started with straightforward, easy-to-use interfaces.",
    },
    {
      icon: ShieldCheck,
      title: "Privacy-conscious design",
      description:
        "Build your workflow with clear information about tool usage and data handling.",
    },
    {
      icon: MonitorSmartphone,
      title: "Responsive workspace",
      description:
        "Use the platform across desktop, tablet and mobile screens.",
    },
  ];

  return (
    <Section
      id="platform-highlights"
      eyebrow="Why choose our platform"
      title="A smarter way to get things done"
      description="Useful AI experiences with a focus on simplicity, accessibility and productivity."
      className="bg-muted/30"
    >
      <MotionDiv
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={viewportSettings}
        className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
      >
        {highlights.map((item) => (
          <FeatureCard key={item.title} {...item} />
        ))}
      </MotionDiv>
    </Section>
  );
}

/* -------------------------------------------------------
   Tools rail
------------------------------------------------------- */

function ToolRail({
  title,
  description,
  featured,
  href = "/tools",
  emptyTitle = "More tools are coming",
  emptyDescription = "We are working on adding more useful AI tools.",
}) {
  const tools = getFeatured(featured) || [];

  return (
    <div>
      {tools.length > 0 ? (
        <>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {tools.slice(0, 8).map((tool, index) => (
              <MotionDiv
                key={tool.id || tool.slug || index}
                variants={fadeUp}
                transition={{
                  ...cardTransition,
                  delay: (index % 4) * 0.05,
                }}
              >
                <ToolCard tool={tool} />
              </MotionDiv>
            ))}
          </div>

          <div className="mt-10 flex justify-center">
            <ArrowLink href={href}>{title}</ArrowLink>
          </div>
        </>
      ) : (
        <div className="rounded-3xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
          <Sparkles className="mx-auto h-8 w-8 text-primary" />

          <h3 className="mt-4 text-lg font-bold text-foreground">
            {emptyTitle}
          </h3>

          <p className="mt-2 text-sm text-muted-foreground">
            {emptyDescription}
          </p>

          <div className="mt-5">
            <ArrowLink href={href}>Explore available tools</ArrowLink>
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------
   Popular tools
------------------------------------------------------- */

export function PopularTools() {
  return (
    <Section
      id="popular-tools"
      eyebrow="Community favorites"
      title="Popular AI tools"
      description="Explore some of the tools users are discovering on our platform."
    >
      <ToolRail featured="popular" title="Explore all tools" href="/tools" />
    </Section>
  );
}

/* -------------------------------------------------------
   Trending tools
------------------------------------------------------- */

export function TrendingTools() {
  return (
    <Section
      id="trending-tools"
      eyebrow="Explore what is trending"
      title="Trending AI tools"
      description="Discover tools worth exploring for your next creative project."
      className="bg-muted/30"
    >
      <ToolRail
        featured="trending"
        title="View all trending tools"
        href="/tools"
      />
    </Section>
  );
}

/* -------------------------------------------------------
   New tools
------------------------------------------------------- */

export function NewTools() {
  return (
    <Section
      id="new-tools"
      eyebrow="Fresh additions"
      title="Recently added tools"
      description="Check out new additions to the platform and discover more ways to work with AI."
    >
      <ToolRail featured="new" title="Discover all tools" href="/tools" />
    </Section>
  );
}

/* -------------------------------------------------------
   Featured categories
------------------------------------------------------- */

export function FeaturedCategories() {
  const featuredCategories = (categories || []).slice(0, 8);

  return (
    <Section
      id="categories"
      eyebrow="Browse by category"
      title="Find the right tool for your next idea"
      description="Explore different AI tool categories and find the experience that fits your needs."
      className="bg-muted/30"
    >
      <MotionDiv
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={viewportSettings}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {featuredCategories.map((category, index) => {
          const slug = category.slug || category.id;
          const name = category.name || category.title || "AI Tools";

          return (
            <MotionDiv
              key={category.id || slug || index}
              variants={fadeUp}
              transition={cardTransition}
            >
              <Link
                href={`/categories/${slug}`}
                className="group flex h-full items-center gap-4 rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                  <CategoryIcon category={category} />
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-bold text-foreground">{name}</h3>

                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                    {category.description || "Explore useful AI tools."}
                  </p>
                </div>

                <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-all group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-primary" />
              </Link>
            </MotionDiv>
          );
        })}
      </MotionDiv>

      <div className="mt-9 text-center">
        <ArrowLink href="/categories">Explore all categories</ArrowLink>
      </div>
    </Section>
  );
}

/* -------------------------------------------------------
   AI capabilities
------------------------------------------------------- */

export function AICapabilities() {
  const capabilities = [
    {
      icon: ImageIcon,
      title: "AI Image Creation",
      description:
        "Explore image-related tools for visual ideas, creative assets and design workflows.",
      href: "/categories/image",
    },
    {
      icon: Video,
      title: "AI Video Tools",
      description:
        "Discover tools for video creation, editing and visual storytelling.",
      href: "/categories/video",
    },
    {
      icon: FileText,
      title: "AI Writing Tools",
      description:
        "Work with writing assistants for content ideas, drafts and everyday text tasks.",
      href: "/categories/writing",
    },
    {
      icon: Code2,
      title: "AI Developer Tools",
      description:
        "Explore AI-assisted tools for coding, development and technical productivity.",
      href: "/categories/developer",
    },
  ];

  return (
    <Section
      id="ai-capabilities"
      eyebrow="Explore AI possibilities"
      title="Tools for every kind of creativity"
      description="From visual content to writing and development, discover tools for different kinds of work."
    >
      <div className="grid gap-5 md:grid-cols-2">
        {capabilities.map((item, index) => {
          const Icon = item.icon;

          return (
            <MotionDiv
              key={item.title}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={viewportSettings}
              transition={{
                ...cardTransition,
                delay: index * 0.07,
              }}
            >
              <Link
                href={item.href}
                className="group flex h-full gap-5 rounded-3xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl"
              >
                <AnimatedIcon
                  icon={Icon}
                  className="h-16 w-16 rounded-2xl"
                  iconClassName="h-7 w-7"
                />

                <div className="flex-1">
                  <h3 className="text-lg font-bold text-foreground">
                    {item.title}
                  </h3>

                  <p className="mt-2 text-sm leading-7 text-muted-foreground">
                    {item.description}
                  </p>

                  <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                    Explore category
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            </MotionDiv>
          );
        })}
      </div>
    </Section>
  );
}

/* -------------------------------------------------------
   Media showcase
------------------------------------------------------- */

export function MediaShowcase() {
  return (
    <Section
      id="media-showcase"
      eyebrow="Create more with AI"
      title="Bring your ideas to life"
      description="Explore creative workflows that help you turn inspiration into digital content."
      className="bg-muted/30"
    >
      <div className="grid gap-5 lg:grid-cols-2">
        <MotionDiv
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportSettings}
          className="group relative overflow-hidden rounded-3xl border border-border bg-card p-8 sm:p-10"
        >
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/10 blur-3xl transition-all duration-500 group-hover:bg-primary/20" />

          <div className="relative">
            <AnimatedIcon icon={Palette} />

            <h3 className="mt-8 text-2xl font-bold text-foreground">
              Explore visual creativity
            </h3>

            <p className="mt-4 max-w-md leading-8 text-muted-foreground">
              Discover AI image tools for artwork, creative concepts, product
              visuals and more.
            </p>

            <ArrowLink href="/categories/image" className="mt-7">
              Explore image tools
            </ArrowLink>
          </div>
        </MotionDiv>

        <MotionDiv
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportSettings}
          transition={{ delay: 0.1, ...cardTransition }}
          className="group relative overflow-hidden rounded-3xl border border-border bg-card p-8 sm:p-10"
        >
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-violet-500/10 blur-3xl transition-all duration-500 group-hover:bg-violet-500/20" />

          <div className="relative">
            <AnimatedIcon
              icon={Video}
              className="border-violet-500/20 bg-violet-500/10 text-violet-500 group-hover:bg-violet-600"
            />

            <h3 className="mt-8 text-2xl font-bold text-foreground">
              Discover video workflows
            </h3>

            <p className="mt-4 max-w-md leading-8 text-muted-foreground">
              Find video-related AI tools for content creation, storytelling and
              editing workflows.
            </p>

            <ArrowLink href="/categories/video" className="mt-7">
              Explore video tools
            </ArrowLink>
          </div>
        </MotionDiv>
      </div>
    </Section>
  );
}

/* -------------------------------------------------------
   Workflow showcase
------------------------------------------------------- */

export function WorkflowShowcase() {
  const workflow = [
    {
      icon: Search,
      title: "Discover",
      description: "Find an AI tool that matches your task.",
    },
    {
      icon: MousePointerClick,
      title: "Choose",
      description: "Open the tool and review how it works.",
    },
    {
      icon: Wand2,
      title: "Create",
      description: "Use the available features to work on your idea.",
    },
    {
      icon: Rocket,
      title: "Move forward",
      description: "Continue your project with your generated results.",
    },
  ];

  return (
    <Section
      id="workflow"
      eyebrow="Simple workflow"
      title="From idea to result in a few steps"
      description="A straightforward experience that helps you discover and use AI tools."
    >
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {workflow.map((item, index) => (
          <MotionDiv
            key={item.title}
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={viewportSettings}
            transition={{
              ...cardTransition,
              delay: index * 0.08,
            }}
            className="relative rounded-2xl border border-border bg-card p-6"
          >
            <div className="mb-6 flex items-center justify-between">
              <AnimatedIcon icon={item.icon} />

              <span className="text-3xl font-black text-muted-foreground/20">
                0{index + 1}
              </span>
            </div>

            <h3 className="text-lg font-bold text-foreground">{item.title}</h3>

            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              {item.description}
            </p>
          </MotionDiv>
        ))}
      </div>
    </Section>
  );
}

/* -------------------------------------------------------
   How it works
------------------------------------------------------- */

export function HowItWorks() {
  const steps = [
    {
      number: "01",
      title: "Browse the collection",
      description:
        "Explore categories and discover tools that match your needs.",
      icon: Search,
    },
    {
      number: "02",
      title: "Select your tool",
      description: "Open a tool and review its features and requirements.",
      icon: MousePointerClick,
    },
    {
      number: "03",
      title: "Start creating",
      description: "Follow the tool instructions and work on your task.",
      icon: Sparkles,
    },
  ];

  return (
    <Section
      id="how-it-works"
      eyebrow="Getting started"
      title="Start using AI without the complexity"
      description="A simple process designed to help you get started quickly."
      className="bg-muted/30"
    >
      <div className="mx-auto max-w-4xl">
        {steps.map((step, index) => {
          const Icon = step.icon;

          return (
            <MotionDiv
              key={step.number}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={viewportSettings}
              transition={cardTransition}
              className="relative flex gap-5 pb-10 last:pb-0"
            >
              {index !== steps.length - 1 && (
                <div className="absolute bottom-0 left-7 top-16 w-px bg-border" />
              )}

              <div className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
                <Icon className="h-6 w-6" />
              </div>

              <div className="flex-1 rounded-2xl border border-border bg-card p-6">
                <span className="text-xs font-bold tracking-widest text-primary">
                  STEP {step.number}
                </span>

                <h3 className="mt-2 text-lg font-bold text-foreground">
                  {step.title}
                </h3>

                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </MotionDiv>
          );
        })}
      </div>
    </Section>
  );
}

/* -------------------------------------------------------
   Benefits
------------------------------------------------------- */

export function Benefits() {
  const benefits = [
    {
      icon: Clock3,
      title: "Save valuable time",
      description:
        "Discover tools that can help simplify repetitive creative and productivity tasks.",
    },
    {
      icon: Lightbulb,
      title: "Explore new ideas",
      description:
        "Find inspiration and new ways to approach your everyday projects.",
    },
    {
      icon: Layers3,
      title: "Discover more tools",
      description:
        "Explore different tool categories from one organized platform.",
    },
    {
      icon: Globe2,
      title: "Accessible experience",
      description:
        "Browse the platform through a responsive interface across devices.",
    },
  ];

  return (
    <Section
      id="benefits"
      eyebrow="Built around your workflow"
      title="A better way to explore AI"
      description="Useful features and an organized experience to make discovering AI tools easier."
    >
      <MotionDiv
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={viewportSettings}
        className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
      >
        {benefits.map((benefit) => (
          <FeatureCard key={benefit.title} {...benefit} />
        ))}
      </MotionDiv>
    </Section>
  );
}

/* -------------------------------------------------------
   Use cases
------------------------------------------------------- */

export function UseCases() {
  const useCases = [
    {
      icon: Palette,
      title: "Designers",
      description:
        "Explore visual tools for inspiration, design concepts and creative assets.",
    },
    {
      icon: FileText,
      title: "Content creators",
      description:
        "Discover writing and content tools for your publishing workflow.",
    },
    {
      icon: Code2,
      title: "Developers",
      description:
        "Find AI-assisted development tools for coding and technical tasks.",
    },
    {
      icon: Rocket,
      title: "Entrepreneurs",
      description:
        "Explore tools that can support your business and everyday operations.",
    },
  ];

  return (
    <Section
      id="use-cases"
      eyebrow="Made for different workflows"
      title="AI tools for the way you work"
      description="Whether you create content, build products or manage a business, discover tools for your workflow."
      className="bg-muted/30"
    >
      <div className="grid gap-5 md:grid-cols-2">
        {useCases.map((item) => (
          <div
            key={item.title}
            className="group flex gap-5 rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
          >
            <AnimatedIcon icon={item.icon} />

            <div>
              <h3 className="font-bold text-foreground">{item.title}</h3>

              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* -------------------------------------------------------
   Advanced features
------------------------------------------------------- */

export function AdvancedFeatures() {
  const features = [
    {
      icon: Search,
      title: "Organized discovery",
      description: "Browse tools through categories and featured collections.",
    },
    {
      icon: BrainCircuit,
      title: "AI-focused experiences",
      description: "Discover tools designed around different AI-powered tasks.",
    },
    {
      icon: RefreshCw,
      title: "Growing collection",
      description:
        "Explore new additions as the platform's tool directory expands.",
    },
    {
      icon: LockKeyhole,
      title: "Clear tool information",
      description:
        "Review available tool details and usage requirements before getting started.",
    },
    {
      icon: Cloud,
      title: "Flexible discovery",
      description:
        "Explore different types of tools without navigating multiple directories.",
    },
    {
      icon: Cpu,
      title: "Modern technology",
      description:
        "A modern platform experience built for discovering AI-powered solutions.",
    },
  ];

  return (
    <Section
      id="advanced-features"
      eyebrow="Platform features"
      title="Designed for a modern AI experience"
      description="Explore a collection of thoughtful features designed to make discovering tools easier."
    >
      <MotionDiv
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={viewportSettings}
        className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
      >
        {features.map((feature, index) => (
          <MotionDiv
            key={feature.title}
            variants={fadeUp}
            transition={cardTransition}
            className="group rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5"
          >
            <div className="flex items-center justify-between">
              <AnimatedIcon icon={feature.icon} />

              <span className="text-xs font-bold tracking-widest text-muted-foreground/50">
                0{index + 1}
              </span>
            </div>

            <h3 className="mt-6 font-bold text-foreground">{feature.title}</h3>

            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              {feature.description}
            </p>
          </MotionDiv>
        ))}
      </MotionDiv>
    </Section>
  );
}

/* -------------------------------------------------------
   Pricing preview
------------------------------------------------------- */

export function PricingPreview() {
  const pricingPlans = plans || [];

  return (
    <Section
      id="pricing"
      eyebrow="Simple pricing"
      title="Choose a plan that fits your needs"
      description="Explore the available plans and choose the option that works for your workflow."
      className="bg-muted/30"
    >
      {pricingPlans.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {pricingPlans.slice(0, 3).map((plan, index) => (
            <MotionDiv
              key={plan.id || plan.name || index}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={viewportSettings}
              transition={cardTransition}
              className={`relative flex flex-col rounded-3xl border bg-card p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                plan.popular
                  ? "border-primary shadow-lg shadow-primary/10"
                  : "border-border"
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-bold text-primary-foreground">
                  Most popular
                </span>
              )}

              <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>

              {plan.description && (
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {plan.description}
                </p>
              )}

              <div className="mt-6">
                <span className="text-4xl font-black tracking-tight text-foreground">
                  {plan.price}
                </span>

                {plan.period && (
                  <span className="ml-2 text-sm text-muted-foreground">
                    / {plan.period}
                  </span>
                )}
              </div>

              {plan.credits && (
                <p className="mt-3 text-sm font-medium text-primary">
                  {plan.credits} credits
                </p>
              )}

              <div className="my-6 h-px bg-border" />

              <ul className="flex-1 space-y-3">
                {(plan.features || []).map((feature, featureIndex) => (
                  <li
                    key={feature.id || featureIndex}
                    className="flex items-start gap-3 text-sm text-muted-foreground"
                  >
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>
                      {typeof feature === "string"
                        ? feature
                        : feature.name || feature.title}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                href="/pricing"
                className={`mt-8 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all ${
                  plan.popular
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "border border-border bg-background text-foreground hover:border-primary hover:text-primary"
                }`}
              >
                Explore plan
                <ArrowRight className="h-4 w-4" />
              </Link>
            </MotionDiv>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center">
          <h3 className="font-bold text-foreground">
            Pricing information coming soon
          </h3>

          <p className="mt-2 text-sm text-muted-foreground">
            Check back for available plans.
          </p>
        </div>
      )}

      <div className="mt-9 text-center">
        <ArrowLink href="/pricing">View pricing details</ArrowLink>
      </div>
    </Section>
  );
}

/* -------------------------------------------------------
   Testimonials
------------------------------------------------------- */

export function Testimonials() {
  // Only render real testimonials supplied by your application.
  const testimonials = [];

  if (!testimonials.length) return null;

  return (
    <Section
      id="testimonials"
      eyebrow="User feedback"
      title="What people say"
      description="Feedback from people using the platform."
    >
      <div className="grid gap-5 md:grid-cols-3">
        {testimonials.map((item, index) => (
          <MotionDiv
            key={item.id || index}
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={viewportSettings}
            className="rounded-2xl border border-border bg-card p-6"
          >
            <div className="mb-5 flex gap-1 text-amber-500">
              {Array.from({ length: 5 }).map((_, starIndex) => (
                <Star key={starIndex} className="h-4 w-4 fill-current" />
              ))}
            </div>

            <p className="text-sm leading-7 text-muted-foreground">
              {item.quote || item.message}
            </p>

            <div className="mt-6 border-t border-border pt-5">
              <h3 className="font-bold text-foreground">{item.name}</h3>

              <p className="mt-1 text-xs text-muted-foreground">
                {item.role || "Platform user"}
              </p>
            </div>
          </MotionDiv>
        ))}
      </div>
    </Section>
  );
}

/* -------------------------------------------------------
   FAQs
------------------------------------------------------- */

export function Faqs() {
  const questions = faqs || [];

  return (
    <Section
      id="faqs"
      eyebrow="Frequently asked questions"
      title="Got questions? We have answers"
      description="Find answers to common questions about exploring and using the platform."
      className="bg-muted/30"
    >
      <div className="mx-auto max-w-3xl space-y-3">
        {questions.map((item, index) => (
          <details
            key={item.id || index}
            className="group rounded-2xl border border-border bg-card p-5 open:border-primary/40"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-foreground marker:hidden">
              <span>{item.question || item.title}</span>

              <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-300 group-open:rotate-180" />
            </summary>

            <div className="mt-4 border-t border-border pt-4 text-sm leading-7 text-muted-foreground">
              {item.answer || item.description}
            </div>
          </details>
        ))}
      </div>
    </Section>
  );
}

/* -------------------------------------------------------
   Final CTA
------------------------------------------------------- */

export function FinalCTA() {
  return (
    <section className="relative overflow-hidden py-20 sm:py-24">
      <div className="absolute inset-0 bg-primary/[0.04]" />

      <div className="absolute -left-32 top-0 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />

      <div className="absolute -bottom-32 -right-20 h-96 w-96 rounded-full bg-violet-500/10 blur-3xl" />

      <div className="relative mx-auto max-w-5xl px-4 text-center sm:px-6">
        <MotionDiv
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportSettings}
          transition={cardTransition}
          className="rounded-[2rem] border border-primary/15 bg-card px-6 py-14 shadow-2xl shadow-primary/5 sm:px-12 sm:py-20"
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Sparkles className="h-8 w-8" />
          </div>

          <h2 className="mx-auto mt-7 max-w-3xl text-balance text-3xl font-black tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Ready to explore the possibilities of AI?
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-muted-foreground">
            Discover useful tools, explore new ideas and find a better way to
            approach your next project.
          </p>

          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/tools"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-7 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:-translate-y-1 hover:bg-primary/90"
            >
              Explore AI tools
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/categories"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-border bg-background px-7 py-3 text-sm font-semibold text-foreground transition-all hover:border-primary hover:text-primary"
            >
              Browse categories
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </MotionDiv>
      </div>
    </section>
  );
}

/* -------------------------------------------------------
   Newsletter
------------------------------------------------------- */

export function Newsletter() {
  return (
    <section id="newsletter" className="border-t border-border py-16">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="max-w-xl">
          <div className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-primary">
            <Send className="h-4 w-4" />
            Stay in the loop
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Discover what's new in AI
          </h2>

          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            Stay connected with the latest platform updates and new tool
            discoveries.
          </p>
        </div>

        <div className="flex w-full max-w-md flex-col gap-3 sm:flex-row">
          <Link
            href="/tools"
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Explore tools
            <ArrowRight className="h-4 w-4" />
          </Link>

          <Link
            href="/contact"
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-border bg-background px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
          >
            Contact us
          </Link>
        </div>
      </div>
    </section>
  );
}
