import { z } from "zod";

export const createGradeSchema = z.object({
  name: z.string().min(1, "Grade name is required").trim(),
  description: z.string().optional(),
});

export const updateGradeSchema = z.object({
  name: z.string().min(1, "Grade name cannot be empty").trim().optional(),
  description: z.string().optional(),
});