"use client";
import { useState } from "react";
import { FormAlert } from "@/components/auth/field";

const MAX_MB = 4;

// Uploads a PDF to /api/uploads/document and reports { assetId, pages, truncated } (or null when cleared).
export function DocumentUploader({ onChange, disabled }) {
  const [state, setState] = useState({ status: "idle", info: null, error: "" });

  async function onFile(e) {
    const file = e.target.files?.[0];
    onChange(null);
    if (!file) { setState({ status: "idle", info: null, error: "" }); return; }
    if (file.type !== "application/pdf") { setState({ status: "idle", info: null, error: "Choose a PDF file." }); e.target.value = ""; return; }
    if (file.size > MAX_MB * 1024 * 1024) { setState({ status: "idle", info: null, error: `The PDF is too large (max ${MAX_MB} MB).` }); e.target.value = ""; return; }

    setState({ status: "uploading", info: null, error: "" });
    try {
      const form = new FormData(); form.append("file", file);
      const res = await fetch("/api/uploads/document", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) { setState({ status: "idle", info: null, error: data.error || "Upload failed." }); e.target.value = ""; return; }
      const info = { assetId: data.id, pages: data.pages, totalPages: data.totalPages, truncated: data.truncated };
      setState({ status: "ready", info, error: "" });
      onChange(info);
    } catch {
      setState({ status: "idle", info: null, error: "Network error. Try uploading again." });
    }
  }

  const { status, info, error } = state;
  return (
    <div>
      <label htmlFor="pdf-file" className="mb-1.5 block text-sm font-medium">PDF document (up to {MAX_MB} MB, must contain selectable text)</label>
      <input id="pdf-file" type="file" accept="application/pdf" onChange={onFile} disabled={disabled || status === "uploading"}
        className="block w-full text-sm file:mr-3 file:rounded-md file:border file:bg-card file:px-3 file:py-2" />
      <div className="mt-2" aria-live="polite">
        {status === "uploading" && <p className="text-sm text-muted-foreground">Reading your PDF…</p>}
        {status === "ready" && (
          <p className="text-sm text-accent">
            Ready: {info.pages} page{info.pages === 1 ? "" : "s"} read.
            {info.truncated && <span className="text-muted-foreground"> This document is long, so only the first {info.pages} pages are used.</span>}
          </p>
        )}
        <FormAlert>{error}</FormAlert>
      </div>
    </div>
  );
}
