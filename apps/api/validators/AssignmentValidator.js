import { z } from "zod";
import mongoose from "mongoose";

const isObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const optionalDateTime = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().datetime({ message: "Due date must be a valid ISO datetime" }).optional(),
);

export const createAssignmentSchema = z.object({
  title: z.string().min(1, "Assignment title is required").trim(),
  description: z.string().trim().optional(),
  module: z
    .string()
    .min(1, "Module is required")
    .refine(isObjectId, "Module id is invalid"),
  materialUrl: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string().url("Material URL must be a valid URL").trim().optional(),
  ),
  dueDate: optionalDateTime,
});

export const updateAssignmentSchema = z.object({
  title: z.string().min(1, "Assignment title is required").trim().optional(),
  description: z.string().trim().optional(),
  module: z.string().refine(isObjectId, "Module id is invalid").optional(),
  materialUrl: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string().url("Material URL must be a valid URL").trim().optional(),
  ),
  dueDate: optionalDateTime,
});

export const submitAssignmentSchema = z.object({
  notes: z.string().trim().max(1000, "Notes cannot exceed 1000 characters").optional(),
});
