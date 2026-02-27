import { z } from "zod";

/*
  GradeValidator
  - Validates payloads for creating and updating `Grade` documents.
  - Rules are intentionally simple: `name` is required on create and
    must be a non-empty string when provided on update.
*/

export const createGradeSchema = z.object({
  name: z.string().min(1, "Grade name is required").trim(),
  description: z.string().optional(),
});

export const updateGradeSchema = z.object({
  name: z.string().min(1, "Grade name cannot be empty").trim().optional(),
  description: z.string().optional(),
});