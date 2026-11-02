import { Suspense } from "react";
import { ToolExplorer } from "@/components/marketing/tool-explorer";
import { tools } from "@/lib/tools/registry";

export const metadata = {
  title: "AI Tools Directory",
  description: "Search and filter every AI Studio tool by category, credit cost and status.",
  alternates: { canonical: "/tools" },
};

export default function ToolsPage() {
  return (
    <div className="container py-12">
      <h1 className="text-3xl font-bold md:text-4xl">AI tools</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">{tools.length} tools across 15 studios. Each tool shows its status and credit cost.</p>
      <div className="mt-8">
        <Suspense fallback={<div className="h-40 animate-pulse rounded-lg bg-muted" aria-label="Loading tools" />}>
          <ToolExplorer />
        </Suspense>
      </div>
    </div>
  );
}
