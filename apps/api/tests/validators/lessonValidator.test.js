import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import {
  createLessonSchema,
  updateLessonSchema,
} from "../../validators/LessonValidator.js";

// 🔧 Valid MongoDB ObjectId
const validObjectId = "507f1f77bcf86cd799439011";

describe("LessonValidator", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ✅ POSITIVE TEST
  // ✔ Valid lesson with Zoom meeting
  it("passes with valid input", () => {
    const result = createLessonSchema.safeParse({
      title: "Algebra Intro",
      module: validObjectId,
      materialUrl: "https://example.com/algebra.pdf",
      createZoomMeeting: true,
      zoomStartTime: "2026-05-01T08:00:00.000Z",
    });

    expect(result.success).toBe(true);
  });

  // ❌ NEGATIVE TEST
  // ✔ Missing required fields
  it("fails when required fields are missing", () => {
    const result = createLessonSchema.safeParse({
      description: "Missing title and module",
    });

    expect(result.success).toBe(false);
  });

  // ❌ NEGATIVE TEST
  // ✔ Invalid ObjectId + invalid date format
  it("fails when format/type is invalid", () => {
    const result = updateLessonSchema.safeParse({
      module: "bad-id",
      zoomStartTime: "next-week",
    });

    expect(result.success).toBe(false);
  });
});