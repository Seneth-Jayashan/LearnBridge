import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import {
  createAssignmentSchema,
  updateAssignmentSchema,
} from "../../validators/AssignmentValidator.js";

// 🔧 Valid MongoDB ObjectId for testing
const validObjectId = "507f1f77bcf86cd799439011";

describe("AssignmentValidator", () => {
  beforeEach(() => {
    // 🔄 Clear mocks (not heavily needed here, but keeps consistency)
    jest.clearAllMocks();
  });

  // ✅ POSITIVE TEST
  // ✔ Valid input should pass schema validation
  it("passes with valid input", () => {
    const result = createAssignmentSchema.safeParse({
      title: "Homework 1",
      description: "Solve chapter 2",
      module: validObjectId,
      materialUrl: "https://example.com/homework.pdf",
      dueDate: "2026-05-01T10:30:00.000Z",
    });

    expect(result.success).toBe(true);
  });

  // ❌ NEGATIVE TEST
  // ✔ Missing required fields should fail
  it("fails when required fields are missing", () => {
    const result = createAssignmentSchema.safeParse({
      description: "Missing title and module",
    });

    expect(result.success).toBe(false);
  });

  // ❌ NEGATIVE TEST
  // ✔ Invalid types/formats should fail
  it("fails when format/type is invalid", () => {
    const result = updateAssignmentSchema.safeParse({
      module: "not-an-object-id", // invalid ObjectId
      dueDate: "tomorrow",       // invalid date format
    });

    expect(result.success).toBe(false);
  });
});