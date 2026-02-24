import { z } from "zod";
import mongoose from "mongoose";

const isObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

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

const optionalDateTime = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().datetime({ message: "Zoom date/time must be a valid ISO datetime" }).optional(),
);

export const createLessonSchema = z
  .object({
    title: z.string().min(1, "Lesson title is required").trim(),
    description: z.string().trim().optional(),
    module: z
      .string()
      .min(1, "Module is required")
      .refine(isObjectId, "Module id is invalid"),
    materialUrl: optionalUrl,
    videoUrl: optionalUrl,
    createZoomMeeting: optionalBoolean,
    zoomStartTime: optionalDateTime,
    onlineMeetingStartTime: optionalDateTime,
  })
  .superRefine((data, ctx) => {
    if (data.createZoomMeeting && !data.zoomStartTime && !data.onlineMeetingStartTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["zoomStartTime"],
        message: "Zoom date/time is required when creating a Zoom meeting",
      });
    }
  });

export const updateLessonSchema = z
  .object({
    title: z.string().min(1, "Lesson title cannot be empty").trim().optional(),
    description: z.string().trim().optional(),
    module: z.string().refine(isObjectId, "Module id is invalid").optional(),
    materialUrl: optionalUrl,
    videoUrl: optionalUrl,
    createZoomMeeting: optionalBoolean,
    zoomStartTime: optionalDateTime,
    onlineMeetingStartTime: optionalDateTime,
  })
  .superRefine((data, ctx) => {
    if (data.createZoomMeeting && !data.zoomStartTime && !data.onlineMeetingStartTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["zoomStartTime"],
        message: "Zoom date/time is required when creating a Zoom meeting",
      });
    }
  });
