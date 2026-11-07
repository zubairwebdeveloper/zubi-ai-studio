import { toolBindings } from "../../../config/tool-bindings.js";
import { getModel } from "../registry.js";
import { ProviderError } from "../errors.js";
import { removeBackground } from "../providers/removebg.js";
import { generateImage, editImage } from "../providers/openai-images.js";
import { sniffImageType } from "../../storage/validate.js";

// Storage is injected so this adapter stays testable without Firebase:
//   loadAsset(assetId, uid) -> { buffer, contentType } | null
//   saveOutput({ uid, buffer, contentType, toolSlug }) -> { id }
export function createImageAdapter({ loadAsset, saveOutput }) {
  return {
    async submit({ job }) {
      const binding = toolBindings[job.toolSlug];
      const model = getModel(job.modelId);
      if (!binding || !model) throw new ProviderError("Tool binding or model unavailable", { code: "unavailable", publicKey: "unavailable" });

      let buffer;
      if (binding.operation === "generate") {
        buffer = await generateImage({ model: model.providerModel, prompt: job.input.text });
      } else {
        const asset = await loadAsset(job.input.assetId, job.userId);
        if (!asset) throw new ProviderError("Input image not found", { code: "asset_missing", publicKey: "rejected" });
        buffer = binding.operation === "edit"
          ? await editImage({ model: model.providerModel, prompt: job.input.text, buffer: asset.buffer, contentType: asset.contentType })
          : await removeBackground({ buffer: asset.buffer, contentType: asset.contentType });
      }

      const contentType = sniffImageType(buffer);
      if (!contentType) throw new ProviderError("Provider returned data that is not a supported image", { code: "bad_output", publicKey: "empty" });

      // If storing fails AFTER the provider succeeded, never retry (that would pay the provider twice).
      let saved;
      try {
        saved = await saveOutput({ uid: job.userId, buffer, contentType, toolSlug: job.toolSlug });
      } catch (err) {
        throw new ProviderError(`Output could not be stored: ${err?.message}`, { code: "storage_failed", publicKey: "unavailable", needsReview: true });
      }
      return { state: "succeeded", output: { assetId: saved.id, contentType }, usage: { images: 1 } };
    },
    async poll() {
      throw new Error("Image jobs are synchronous and cannot be polled.");
    },
  };
}
