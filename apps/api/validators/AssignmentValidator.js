import { z } from "zod";
import mongoose from "mongoose";

/*
  AssignmentValidator
  - Validates request payloads related to assignments:
    * `createAssignmentSchema` - required fields for creating an assignment
    * `updateAssignmentSchema` - partial update rules for assignments
    * `submitAssignmentSchema` - payload accepted when a student submits
  - Notes:
    * `module` ids are validated as MongoDB ObjectId strings via `isObjectId`.
    * Empty-string form fields are normalized to `undefined` so optional
      URL/date fields pass when left blank in forms.
*/

const isObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

// Normalize empty strings to `undefined` and validate ISO datetime strings
const optionalDateTime = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().datetime({ message: "Due date must be a valid ISO datetime" }).optional(),
);

export const createAssignmentSchema = z.object({
  title: z.string().min(1, "Assignment title is required").trim(),
  description: z.string().trim().optional(),
  // `module` must be a non-empty string that is a valid ObjectId
  module: z
    .string()
    .min(1, "Module is required")
    .refine(isObjectId, "Module id is invalid"),
  // Allow empty string from forms to be treated as omitted
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

// Submission payload for students; `notes` is optional and limited in length
export const submitAssignmentSchema = z.object({
  notes: z.string().trim().max(1000, "Notes cannot exceed 1000 characters").optional(),
});
