import { z } from "zod";

// Reusable Question Schema
const questionSchema = z.object({
  questionText: z.string().min(1, "Question text is required"),
  options: z
    .array(z.string().min(1, "Option cannot be empty"))
    .length(4, "Each question must have exactly 4 options"),
  correctAnswer: z
    .number()
    .int()
    .min(0, "Correct answer index must be at least 0")
    .max(3, "Correct answer index must be at most 3"),
  isFlagged: z.boolean().optional(),
});

// --- Create Quiz Schema ---
export const createQuizSchema = z.object({
  title: z.string().min(1, "Title is required"),
  moduleId: z.string().min(1, "Module ID is required"),
  questions: z
    .array(questionSchema)
    .min(1, "Quiz must have at least one question"),
  timeLimit: z
    .number()
    .int()
    .positive("Time limit must be a positive number"),
  isPublished: z.boolean().optional(),
});

// --- Update Quiz Schema ---
export const updateQuizSchema = z.object({
  title: z.string().min(1, "Title cannot be empty").optional(),
  moduleId: z.string().min(1, "Module ID cannot be empty").optional(),
  questions: z
    .array(questionSchema)
    .min(1, "Quiz must have at least one question")
    .optional(),
  timeLimit: z
    .number()
    .int()
    .positive("Time limit must be a positive number")
    .optional(),
  isPublished: z.boolean().optional(),
});

// --- Submit Quiz Schema ---
export const submitQuizSchema = z.object({
  answers: z
    .array(
      z
        .number()
        .int()
        .min(0, "Answer index must be at least 0")
        .max(3, "Answer index must be at most 3")
    )
    .min(1, "Answers array cannot be empty"),
  flaggedQuestions: z.array(z.number().int().min(0)).optional(),
});