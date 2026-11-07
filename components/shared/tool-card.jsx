import Link from "next/link";
import { Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { CategoryIcon } from "@/components/shared/icon";
import { getCategoryById } from "@/lib/tools/registry";
import { cn } from "@/lib/utils";

// Presentational. Pass onToggleFavorite + isFavorite only where favorites state exists.
export function ToolCard({ tool, isFavorite, onToggleFavorite, href }) {
  const category = getCategoryById(tool.category);
  return (
    <div className="group relative flex flex-col rounded-lg border bg-card p-4 transition-colors hover:border-primary/50">
      <div className="mb-3 flex items-start justify-between gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-secondary text-primary">
          <CategoryIcon name={category?.icon} className="h-4 w-4" />
        </span>
        {onToggleFavorite && (
          <button
            type="button"
            onClick={() => onToggleFavorite(tool.slug)}
            aria-pressed={!!isFavorite}
            aria-label={isFavorite ? `Remove ${tool.name} from favorites` : `Add ${tool.name} to favorites`}
            className="relative z-10 rounded-md p-1.5 text-muted-foreground hover:bg-muted"
          >
            <Heart className={cn("h-4 w-4", isFavorite && "fill-primary text-primary")} />
          </button>
        )}
      </div>
      <h3 className="text-base font-semibold leading-snug">
        <Link href={href || `/tools/${tool.slug}`} className="after:absolute after:inset-0">
          {tool.name}
        </Link>
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">{category?.short}</p>
      <div className="mt-4 flex items-center gap-2">
        <StatusBadge status={tool.status} />
        <Badge variant="credit">{tool.credits} credits</Badge>
      </div>
    </div>
  );
}
