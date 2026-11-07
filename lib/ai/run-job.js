import "server-only";
import { executeJob } from "@/lib/ai/engine";
import { firestoreStore } from "@/lib/ai/store";
import { adapters as baseAdapters } from "@/lib/ai/adapters/text";
import { createImageAdapter } from "@/lib/ai/adapters/image";
import { createDocumentAdapter } from "@/lib/ai/adapters/document";
import { loadDocumentText } from "@/lib/documents/store";
import { saveBuffer, loadOwnedAsset } from "@/lib/storage";
import { credits } from "@/lib/credits/service";

const adapters = {
  ...baseAdapters,
  document: createDocumentAdapter({ loadDocumentText }),
  image: createImageAdapter({
    loadAsset: (assetId, uid) => loadOwnedAsset(assetId, uid),
    saveOutput: ({ uid, buffer, contentType, toolSlug }) => saveBuffer({ uid, kind: "output", buffer, contentType, source: toolSlug }),
  }),
};

export function runJob(jobId) {
  return executeJob({
    jobId,
    store: firestoreStore,
    // Success captures the reserved credits; any failure refunds them in full.
    billing: { capture: (id) => credits.capture(id), release: (id, reason) => credits.release(id, reason) },
    getAdapter: (job) => {
      const adapter = adapters[job.kind];
      if (!adapter) throw new Error(`No adapter for kind "${job.kind}"`);
      return adapter;
    },
  });
}
