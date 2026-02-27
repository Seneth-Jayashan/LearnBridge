import { z } from "zod";

/*
  LevelValidator
  - Validates payloads for `Level` documents (e.g., Primary, Junior Secondary).
  - Simple rules: `name` is required on create and must be non-empty when provided.
*/

export const createLevelSchema = z.object({
  name: z.string().min(1, "Level name is required").trim(),
  description: z.string().optional(),
});

export const updateLevelSchema = z.object({
  name: z.string().min(1, "Level name cannot be empty").trim().optional(),
  description: z.string().optional(),
});