import { z } from "zod";

export const sessionBodySchema = z.object({
  idToken: z
    .string()
    .min(1, "Firebase ID token is required.")
    .max(10000, "Invalid Firebase ID token."),
});
