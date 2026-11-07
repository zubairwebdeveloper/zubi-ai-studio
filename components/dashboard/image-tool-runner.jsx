"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/auth/field";

const POLL_MS = 2000;
const MAX_WAIT_MS = 240_000;
const MAX_MB = 4;

export function ImageToolRunner({
  toolSlug,
  label,
  placeholder,
  maxChars,
  needsText,
  needsImage,
  credits,
  transparent,
}) {
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [phase, setPhase] = useState("idle"); // idle | uploading | working | done | error
  const [resultId, setResultId] = useState("");
  const [error, setError] = useState("");
  const keyRef = useRef(null); // reused after a network drop so one click never creates two jobs
  const assetRef = useRef(null); // uploaded asset for the current file
  const timer = useRef(null);
  const alive = useRef(true);

  useEffect(
    () => () => {
      alive.current = false;
      clearTimeout(timer.current);
    },
    [],
  );
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );

  function onFile(e) {
    const f = e.target.files?.[0];
    setError("");
    assetRef.current = null;
    keyRef.current = null;
    if (!f) {
      setFile(null);
      setPreview("");
      return;
    }
    if (!["image/png", "image/jpeg", "image/webp"].includes(f.type)) {
      setError("Choose a PNG, JPEG or WebP image.");
      e.target.value = "";
      return;
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      setError(`The image is too large (max ${MAX_MB} MB).`);
      e.target.value = "";
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function poll(id, startedAt) {
    if (!alive.current) return;
    try {
      const res = await fetch(`/api/jobs/${id}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load the result.");
      if (data.status === "succeeded") {
        setResultId(data.output?.assetId || "");
        setPhase("done");
        keyRef.current = null;
        return;
      }
      if (data.status === "failed") {
        setError(data.error || "The request failed.");
        setPhase("error");
        keyRef.current = null;
        return;
      }
      if (Date.now() - startedAt > MAX_WAIT_MS) {
        setError(
          "This is taking longer than expected. Check History in a few minutes.",
        );
        setPhase("error");
        return;
      }
      timer.current = setTimeout(() => poll(id, startedAt), POLL_MS);
    } catch (err) {
      setError(err.message || "Network error.");
      setPhase("error");
    }
  }

  async function run() {
    setError("");
    setResultId("");
    try {
      if (needsImage && !assetRef.current) {
        setPhase("uploading");
        const form = new FormData();
        form.append("file", file);
        const up = await fetch("/api/uploads", { method: "POST", body: form });
        const upData = await up.json();
        if (!up.ok) {
          setError(upData.error || "Upload failed.");
          setPhase("error");
          return;
        }
        assetRef.current = upData.id;
      }
      setPhase("working");
      keyRef.current = keyRef.current || crypto.randomUUID().replace(/-/g, "");
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toolSlug,
          text,
          assetId: assetRef.current || undefined,
          idempotencyKey: keyRef.current,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not start the job.");
        setPhase("error");
        keyRef.current = null;
        return;
      }
      poll(data.id, Date.now());
    } catch {
      setError("Network error. Press Run again to retry safely.");
      setPhase("error"); // keys kept on purpose
    }
  }

  const busy = phase === "uploading" || phase === "working";
  const ready = (!needsText || text.trim()) && (!needsImage || file);
  const checker = transparent
    ? {
        backgroundImage:
          "repeating-conic-gradient(hsl(var(--muted)) 0% 25%, hsl(var(--card)) 0% 50%)",
        backgroundSize: "16px 16px",
      }
    : undefined;

  return (
    <div className="max-w-4xl space-y-5">
      {needsImage && (
        <div>
          <label
            htmlFor="img-file"
            className="mb-1.5 block text-sm font-medium"
          >
            Image (PNG, JPEG or WebP, up to {MAX_MB} MB)
          </label>
          <input
            id="img-file"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={onFile}
            disabled={busy}
            className="block w-full text-sm file:mr-3 file:rounded-md file:border file:bg-card file:px-3 file:py-2"
          />
        </div>
      )}
      {needsText && (
        <div>
          <label
            htmlFor="img-text"
            className="mb-1.5 block text-sm font-medium"
          >
            {label}
          </label>
          <textarea
            id="img-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={maxChars}
            rows={4}
            placeholder={placeholder}
            disabled={busy}
            className="w-full rounded-md border border-input bg-card p-3 text-sm placeholder:text-muted-foreground disabled:opacity-60"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            {text.length} / {maxChars} characters
          </p>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={run} disabled={busy || !ready}>
          {phase === "uploading"
            ? "Uploading…"
            : phase === "working"
              ? "Working…"
              : "Run"}
        </Button>
        <span className="text-sm text-muted-foreground">
          Cost: {credits} credits, held when you run and refunded if it fails.
        </span>
      </div>
      <FormAlert>{error}</FormAlert>

      <div className="grid gap-4 md:grid-cols-2">
        {preview && (
          <figure className="rounded-lg border bg-card p-3">
            <figcaption className="mb-2 text-sm font-medium">
              Original
            </figcaption>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Your uploaded image"
              className="max-h-96 w-full rounded-md object-contain"
            />
          </figure>
        )}
        {phase === "working" && (
          <div
            className="h-64 animate-pulse rounded-lg bg-muted"
            role="status"
            aria-label="Generating"
          />
        )}
        {phase === "done" && resultId && (
          <figure className="rounded-lg border bg-card p-3">
            <figcaption className="mb-2 flex items-center justify-between text-sm font-medium">
              Result
              <Button size="sm" variant="outline">
                <a href={`/api/assets/${resultId}?download=1`}>Download</a>
              </Button>
            </figcaption>
            <div className="rounded-md" style={checker}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/assets/${resultId}`}
                alt="Generated result"
                className="max-h-96 w-full rounded-md object-contain"
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Results are kept for 30 days.
            </p>
          </figure>
        )}
      </div>
    </div>
  );
}
