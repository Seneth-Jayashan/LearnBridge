import { z } from "zod";
import mongoose from "mongoose";

const isObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const optionalUrl = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().url("Must be a valid URL").trim().optional(),
);

export const createLessonSchema = z.object({
  title: z.string().min(1, "Lesson title is required").trim(),
  description: z.string().trim().optional(),
  course: z
    .string()
    .min(1, "Course is required")
    .refine(isObjectId, "Course id is invalid"),
  materialUrl: optionalUrl,
  videoUrl: optionalUrl,
});

export const updateLessonSchema = z.object({
  title: z.string().min(1, "Lesson title cannot be empty").trim().optional(),
  description: z.string().trim().optional(),
  course: z.string().refine(isObjectId, "Course id is invalid").optional(),
  materialUrl: optionalUrl,
  videoUrl: optionalUrl,
});
