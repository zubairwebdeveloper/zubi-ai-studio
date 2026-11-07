import { postForm } from "./form.js";
import { getJson } from "./http.js";

const BASE = "https://api.remove.bg/v1.0";
const headers = () => ({ "X-Api-Key": process.env.REMOVE_BG_API_KEY });

export const removebg = {
  id: "removebg",
  name: "remove.bg",
  isConfigured: () => Boolean(process.env.REMOVE_BG_API_KEY),
  async healthCheck() {
    const t = Date.now();
    await getJson(`${BASE}/account`, { headers: headers(), timeoutMs: 10_000 });
    return { latencyMs: Date.now() - t };
  },
};

// Returns the cut-out as PNG bytes.
export async function removeBackground({ buffer, contentType }) {
  const form = new FormData();
  form.append("image_file", new Blob([buffer], { type: contentType }), "image");
  form.append("size", "auto");
  form.append("format", "png");
  return postForm(`${BASE}/removebg`, { headers: headers(), form, response: "buffer" });
}
