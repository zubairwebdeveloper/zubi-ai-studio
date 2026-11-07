import { PageHeader } from "@/components/dashboard/page-header";
import { HealthCheck } from "@/components/admin/health-check";
import { requirePermission } from "@/lib/admin/guard";
import { providers, getAvailableModels } from "@/lib/ai/registry";
import { getToolRuntime } from "@/lib/ai/availability";

export const metadata = { title: "Providers | Admin" };
const KINDS = ["text", "image-generate", "image-edit", "image-remove-bg"];

export default async function ProvidersPage() {
  await requirePermission("providers.read");
  const runtime = await getToolRuntime();
  return (
    <>
      <PageHeader title="Providers" description="Which AI providers are configured on this server. API keys are never shown. A provider counts as configured when its key is set in the server environment." />
      <section aria-labelledby="p-h" className="mb-10">
        <h2 id="p-h" className="mb-3 text-lg font-semibold">Configuration</h2>
        <ul className="divide-y rounded-lg border bg-card text-sm">
          {Object.values(providers).map((p) => (
            <li key={p.id} className="flex items-center justify-between p-3">
              <span className="font-medium">{p.name}</span>
              <span className={p.isConfigured() ? "text-accent" : "text-muted-foreground"}>{p.isConfigured() ? "Key set" : "Not configured"}</span>
            </li>
          ))}
        </ul>
      </section>
      <section aria-labelledby="m-h" className="mb-10">
        <h2 id="m-h" className="mb-3 text-lg font-semibold">Available models</h2>
        <ul className="divide-y rounded-lg border bg-card text-sm">
          {KINDS.map((k) => {
            const models = getAvailableModels(k);
            return (
              <li key={k} className="flex flex-wrap items-center justify-between gap-2 p-3">
                <span className="font-medium">{k}</span>
                <span className="text-muted-foreground">{models.length ? models.map((m) => `${m.providerId}: ${m.providerModel}`).join(", ") : "None available"}</span>
              </li>
            );
          })}
        </ul>
        <p className="mt-2 text-sm text-muted-foreground">{runtime.liveSlugs.length} tools are Live right now.</p>
      </section>
      <section aria-labelledby="h-h">
        <h2 id="h-h" className="mb-3 text-lg font-semibold">Health</h2>
        <HealthCheck />
      </section>
    </>
  );
}
