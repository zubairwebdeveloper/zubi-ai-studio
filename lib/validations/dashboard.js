import { z } from "zod";

export const projectSchema = z.object({
  name: z.string().trim().min(1, "Enter a project name").max(80, "Use 80 characters or fewer"),
  description: z.string().trim().max(300, "Use 300 characters or fewer").optional().default(""),
});

export const profileSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(60, "Use 60 characters or fewer"),
});

export const idSchema = z.string().min(1).max(64).regex(/^[A-Za-z0-9_-]+$/);
export const slugSchema = z.string().min(1).max(100).regex(/^[a-z0-9-]+$/);
