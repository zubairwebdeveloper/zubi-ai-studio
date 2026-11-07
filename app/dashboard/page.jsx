import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ToolCard } from "@/components/shared/tool-card";
import { PageHeader, EmptyState } from "@/components/dashboard/page-header";
import { getTool } from "@/lib/tools/registry";

// Temporary demo data for frontend development
const stats = {
  credits: 1000,
  total: 0,
  succeeded: 0,
  failed: 0,
};

const favoriteSlugs = [
  "ai-chatbot-builder",
  "ai-image-generator",
  "ai-text-generator",
  "ai-voice-generator",
];

function Stat({ label, value, hint }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const recent = [];

  const favorites = favoriteSlugs
    .map((slug) => getTool(slug))
    .filter(Boolean)
    .slice(0, 4);

  return (
    <div className="space-y-10">
      <PageHeader
        title="Welcome to Zubi AI Studio"
        description="Your AI workspace. Create, explore and manage your AI tools."
        action={
          <Button>
            <Link href="/dashboard/tools">Browse tools</Link>
          </Button>
        }
      />

      {/* Overview */}
      <section
        aria-label="Summary"
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
      >
        <Stat
          label="Credits"
          value={stats.credits.toLocaleString("en-US")}
          hint="Demo balance"
        />

        <Stat
          label="Total generations"
          value={stats.total}
          hint="Your total AI generations"
        />

        <Stat
          label="Successful jobs"
          value={stats.succeeded}
          hint="Completed successfully"
        />

        <Stat
          label="Failed jobs"
          value={stats.failed}
          hint="Failed generations"
        />
      </section>

      {/* Subscription */}
      <section aria-labelledby="plan-h">
        <h2 id="plan-h" className="mb-3 text-lg font-semibold">
          Subscription
        </h2>

        <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-card p-4">
          <Badge>Free plan</Badge>

          <p className="text-sm text-muted-foreground">
            Paid plans are not available yet.
          </p>
        </div>
      </section>

      {/* Recent activity */}
      <section aria-labelledby="recent-h">
        <h2 id="recent-h" className="mb-3 text-lg font-semibold">
          Recent activity
        </h2>

        {recent.length === 0 ? (
          <EmptyState title="No activity yet">
            Your recent AI generations will appear here when you start using
            your tools.
          </EmptyState>
        ) : (
          <ul className="divide-y rounded-lg border bg-card">
            {recent.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-3 p-3 text-sm"
              >
                <span className="font-medium">{item.toolName}</span>
                <span className="text-muted-foreground">{item.status}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Favorite tools */}
      <section aria-labelledby="fav-h">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="fav-h" className="text-lg font-semibold">
            Favorite tools
          </h2>

          <Link
            href="/dashboard/tools"
            className="text-sm text-primary hover:underline"
          >
            Explore all tools
          </Link>
        </div>

        {favorites.length === 0 ? (
          <EmptyState title="Tools coming soon">
            Your favorite AI tools will appear here.
          </EmptyState>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {favorites.map((tool) => (
              <ToolCard key={tool.slug} tool={tool} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
