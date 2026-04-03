import { z } from "zod";

const optionalUrl = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().url("Must be a valid URL").trim().optional(),
);

const optionalBoolean = z.preprocess((value) => {
  if (value === "" || value === undefined || value === null) return undefined;
  if (value === true || value === "true") return true;
  if (value === 1 || value === "1" || value === "on" || value === "yes") return true;
  if (value === false || value === "false") return false;
  if (value === 0 || value === "0" || value === "off" || value === "no") return false;
  return value;
}, z.boolean().optional());

export const createKnowledgeBaseSchema = z.object({
  title: z.string().min(1, "Title is required").trim(),
  content: z.string().min(1, "Content is required").trim(),
  category: z.string().trim().optional(),
  isPublished: optionalBoolean,
});

export const updateKnowledgeBaseSchema = z.object({
  title: z.string().min(1, "Title cannot be empty").trim().optional(),
  content: z.string().min(1, "Content cannot be empty").trim().optional(),
  category: z.string().trim().optional(),
  isPublished: optionalBoolean,
});
