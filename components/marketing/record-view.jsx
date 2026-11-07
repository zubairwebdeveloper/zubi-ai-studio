"use client";
import { useEffect } from "react";

// Records a tool in the "recently viewed" list (browser storage).
export function RecordView({ slug }) {
  useEffect(() => {
    try {
      const key = "ai-studio:recent";
      const list = JSON.parse(localStorage.getItem(key)) || [];
      localStorage.setItem(key, JSON.stringify([slug, ...list.filter((s) => s !== slug)].slice(0, 12)));
    } catch {}
  }, [slug]);
  return null;
}
