"use client";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Field, FormAlert } from "@/components/auth/field";
import { EmptyState } from "@/components/dashboard/page-header";
import { projectSchema } from "@/lib/validations/dashboard";
import { createProject, updateProject, deleteProject } from "@/lib/actions/projects";
import { formatDate } from "@/lib/helpers/format";

function ProjectRow({ project, onError }) {
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [pending, start] = useTransition();
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(projectSchema), defaultValues: { name: project.name, description: project.description },
  });

  const run = (fn, after) => start(async () => {
    onError("");
    const res = await fn();
    if (!res.ok) onError(res.error); else after?.();
  });

  if (editing) {
    return (
      <li className="rounded-lg border bg-card p-4">
        <form onSubmit={handleSubmit((v) => run(() => updateProject(project.id, v), () => setEditing(false)))} className="space-y-3" noValidate>
          <Field id={`n-${project.id}`} label="Name" error={errors.name} register={register("name")} />
          <Field id={`d-${project.id}`} label="Description" error={errors.description} register={register("description")} />
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={pending}>{pending ? "Saving…" : "Save changes"}</Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
          </div>
        </form>
      </li>
    );
  }
  return (
    <li className="flex flex-wrap items-start justify-between gap-3 rounded-lg border bg-card p-4">
      <div className="min-w-0">
        <h3 className="truncate font-semibold">{project.name}</h3>
        {project.description && <p className="mt-0.5 text-sm text-muted-foreground">{project.description}</p>}
        <p className="mt-2 text-xs text-muted-foreground">{project.assetCount} assets · Updated {formatDate(project.updatedAt)}</p>
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={() => setEditing(true)}>Rename</Button>
        {confirming ? (
          <>
            <Button size="sm" className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={pending} onClick={() => run(() => deleteProject(project.id))}>
              {pending ? "Deleting…" : "Confirm delete"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>Cancel</Button>
          </>
        ) : (
          <Button size="sm" variant="ghost" onClick={() => setConfirming(true)}>Delete</Button>
        )}
      </div>
    </li>
  );
}

export function ProjectsManager({ projects }) {
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(projectSchema), defaultValues: { name: "", description: "" },
  });

  const onCreate = (values) => start(async () => {
    setError("");
    const res = await createProject(values);
    if (!res.ok) setError(res.error); else reset();
  });

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit(onCreate)} noValidate className="grid max-w-2xl gap-3 rounded-lg border bg-card p-4 md:grid-cols-[1fr_1.5fr_auto] md:items-end">
        <Field id="p-name" label="Project name" error={errors.name} register={register("name")} />
        <Field id="p-desc" label="Description (optional)" error={errors.description} register={register("description")} />
        <Button type="submit" disabled={pending}>{pending ? "Creating…" : "Create project"}</Button>
      </form>
      <FormAlert>{error}</FormAlert>
      {projects.length === 0 ? (
        <EmptyState title="No projects yet">Projects group your generations and assets. Create your first one above.</EmptyState>
      ) : (
        <ul className="space-y-3">{projects.map((p) => <ProjectRow key={p.id} project={p} onError={setError} />)}</ul>
      )}
    </div>
  );
}
