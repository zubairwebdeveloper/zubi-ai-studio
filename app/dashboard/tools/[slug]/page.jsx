import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PageHeader, EmptyState } from "@/components/dashboard/page-header";
import { TextToolRunner } from "@/components/dashboard/text-tool-runner";
import { ChatRunner } from "@/components/dashboard/chat-runner";
import { ImageToolRunner } from "@/components/dashboard/image-tool-runner";
import { requireUser } from "@/lib/auth/session";
import { getTool } from "@/lib/tools/registry";
import { toolBindings } from "@/config/tool-bindings";
import { resolveModelForTool, getToolRuntime } from "@/lib/ai/availability";

export async function generateMetadata({ params }) {
  const tool = getTool((await params).slug);
  return { title: tool?.name || "Tool" };
}

export default async function ToolWorkspacePage({ params }) {
  await requireUser();
  const tool = getTool((await params).slug);
  if (!tool) notFound();
  const binding = toolBindings[tool.slug];
  const runtime = await getToolRuntime();
  const live =
    binding &&
    resolveModelForTool(tool.slug) &&
    runtime.liveSlugs.includes(tool.slug);
  const credits = runtime.credits[tool.slug] ?? tool.credits;
  const inputs = binding?.inputs || ["text"];
  const needsText = inputs.includes("text");
  const needsDocument = inputs.includes("document");

  return (
    <>
      <PageHeader
        title={tool.name}
        description={live ? undefined : "This tool is not available yet."}
      />
      {!live ? (
        <EmptyState
          title="Coming soon"
          action={
            <Button variant="outline">
              <Link href="/dashboard/tools">Back to tools</Link>
            </Button>
          }
        >
          No AI provider is connected for this tool yet. It will appear as Live
          once one is configured and tested.
        </EmptyState>
      ) : binding.kind === "image" ? (
        <ImageToolRunner
          toolSlug={tool.slug}
          label={binding.label}
          placeholder={binding.placeholder}
          maxChars={binding.maxInputChars || 1}
          needsText={needsText}
          needsImage={inputs.includes("image")}
          credits={credits}
          transparent={binding.operation === "remove-bg"}
        />
      ) : binding.mode === "chat" ? (
        <ChatRunner
          toolSlug={tool.slug}
          placeholder={binding.placeholder}
          maxChars={binding.maxInputChars}
          credits={credits}
          notice={binding.notice}
          needsDocument={needsDocument}
        />
      ) : (
        <TextToolRunner
          toolSlug={tool.slug}
          label={binding.label}
          placeholder={binding.placeholder}
          maxChars={binding.maxInputChars || 1}
          credits={credits}
          options={binding.options || []}
          notice={binding.notice}
          needsText={needsText}
          needsDocument={needsDocument}
        />
      )}
    </>
  );
}
