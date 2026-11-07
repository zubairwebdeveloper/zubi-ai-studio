import Link from "next/link";
import {
  ArrowUpRight,
  Sparkles,
  Image as ImageIcon,
  Video,
  FileText,
  Code2,
  AudioLines,
  WandSparkles,
} from "lucide-react";

const iconMap = {
  image: ImageIcon,
  images: ImageIcon,
  photo: ImageIcon,
  video: Video,
  text: FileText,
  writing: FileText,
  code: Code2,
  coding: Code2,
  audio: AudioLines,
  voice: AudioLines,
};

export function ToolCard({ tool, item, className = "" }) {
  const data = tool || item || {};

  const slug =
    data.slug ||
    data.id ||
    data.toolSlug ||
    "";

  const title =
    data.name ||
    data.title ||
    data.label ||
    "AI Tool";

  const description =
    data.description ||
    data.shortDescription ||
    data.subtitle ||
    "Explore this AI-powered tool and simplify your workflow.";

  const category =
    typeof data.category === "string"
      ? data.category
      : data.category?.name || "AI Tool";

  const iconKey = String(
    data.icon || data.type || category
  ).toLowerCase();

  const Icon = iconMap[iconKey] || Sparkles;

  const href =
    data.href ||
    data.url ||
    (slug ? `/tools/${slug}` : "/tools");

  return (
    <Link
      href={href}
      className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-card p-5 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 ${className}`}
    >
      <div className="mb-5 flex items-start justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border/60 bg-muted/60 text-primary transition-all duration-300 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground">
          <Icon className="h-6 w-6" />
        </div>

        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-border/60 text-muted-foreground transition-all duration-300 group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground">
          <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </div>
      </div>

      <div className="flex flex-1 flex-col">
        <div className="mb-2 flex items-center gap-2">
          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary">
            {category}
          </span>

          {data.isNew && (
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-600">
              NEW
            </span>
          )}

          {data.isPopular && (
            <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-[10px] font-semibold text-amber-600">
              POPULAR
            </span>
          )}
        </div>

        <h3 className="mb-2 text-lg font-bold tracking-tight text-foreground transition-colors group-hover:text-primary">
          {title}
        </h3>

        <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-border/60 pt-4">
        <span className="text-xs font-medium text-muted-foreground">
          {data.isFree === false ? "Premium Tool" : "Free to explore"}
        </span>

        <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
          Explore
          <WandSparkles className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  );
}

export default ToolCard;
