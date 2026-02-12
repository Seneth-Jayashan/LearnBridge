import { z } from "zod";

export const createLevelSchema = z.object({
  name: z.string().min(1, "Level name is required").trim(),
  description: z.string().optional(),
});

export const updateLevelSchema = z.object({
  name: z.string().min(1, "Level name cannot be empty").trim().optional(),
  description: z.string().optional(),
});