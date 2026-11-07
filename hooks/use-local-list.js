"use client";
import { useEffect, useState } from "react";

// Browser-only list (favorites, recently viewed). Synced to Firestore for signed-in users in Phase 3.
export function useLocalList(key, max = 50) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(key));
      setItems(Array.isArray(raw) ? raw : []);
    } catch {
      setItems([]);
    }
  }, [key]);

  function persist(next) {
    setItems(next);
    try { localStorage.setItem(key, JSON.stringify(next)); } catch {}
  }

  return {
    items,
    has: (id) => items.includes(id),
    toggle: (id) => persist(items.includes(id) ? items.filter((i) => i !== id) : [id, ...items].slice(0, max)),
    push: (id) => persist([id, ...items.filter((i) => i !== id)].slice(0, max)),
  };
}
