import { z } from "zod";

/*
  KnowledgeBaseValidator
  - Validates payloads for Knowledge Base entries.
  - Normalizes common form values:
    * empty strings are treated as omitted for optional URL fields
    * boolean-like strings/values ("on", "yes", "1") are mapped to booleans
  - This helps accepting both JSON API clients and HTML form submissions.
*/

const optionalUrl = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().url("Must be a valid URL").trim().optional(),
);

// Accept several representations of boolean-like inputs from forms/clients
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
