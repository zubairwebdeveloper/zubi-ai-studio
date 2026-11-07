"use client";
import { Button } from "@/components/ui/button";

export default function DashboardError({ reset }) {
  return (
    <div role="alert" className="mx-auto max-w-md rounded-lg border bg-card p-8 text-center">
      <h1 className="text-xl font-bold">This page could not load</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Your data is safe. If it keeps happening, check that the Firestore indexes in firebase/firestore.indexes.json are deployed.
      </p>
      <Button className="mt-4" onClick={reset}>Try again</Button>
    </div>
  );
}
