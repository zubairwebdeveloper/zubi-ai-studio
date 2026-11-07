"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export function Field({
  label,
  htmlFor,
  error,
  description,
  required = false,
  className,
  children,
}) {
  return (
    <div className={cn("grid gap-2", className)}>
      {label && (
        <label htmlFor={htmlFor} className="text-sm font-medium leading-none">
          {label}
          {required && <span className="ml-1 text-destructive">*</span>}
        </label>
      )}

      {children}

      {description && !error && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}

      {error && (
        <p className="text-sm font-medium text-destructive" role="alert">
          {typeof error === "string" ? error : error.message}
        </p>
      )}
    </div>
  );
}

export function FormAlert({ error, className }) {
  if (!error) return null;

  const message = typeof error === "string" ? error : error.message;

  if (!message) return null;

  return (
    <div
      role="alert"
      className={cn(
        "rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive",
        className,
      )}
    >
      {message}
    </div>
  );
}
