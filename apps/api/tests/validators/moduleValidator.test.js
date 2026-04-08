import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import {
  createModuleSchema,
  updateModuleSchema,
} from "../../validators/ModuleValidator.js";

// 🔧 Valid MongoDB ObjectId
const validObjectId = "507f1f77bcf86cd799439011";

describe("ModuleValidator", () => {
  beforeEach(() => {
    // 🔄 Reset mocks (consistency)
    jest.clearAllMocks();
  });

  // ✅ POSITIVE TEST
  // ✔ Valid module input should pass
  it("passes with valid input", () => {
    const result = createModuleSchema.safeParse({
      name: "Physics",
      description: "Foundation module",
      thumbnailUrl: "", // optional / can be empty depending on schema
      level: validObjectId,
      grade: validObjectId,
      subjectStream: "Mathematics Stream",
    });

    expect(result.success).toBe(true);
  });

  // ❌ NEGATIVE TEST
  // ✔ Missing required fields (level, grade)
  it("fails when required fields are missing", () => {
    const result = createModuleSchema.safeParse({
      name: "Physics",
      description: "Missing level and grade",
    });

    expect(result.success).toBe(false);
  });

  // ❌ NEGATIVE TEST
  // ✔ Invalid ObjectId + invalid enum/value
  it("fails when format/type is invalid", () => {
    const result = updateModuleSchema.safeParse({
      subjectStream: "Engineering", // invalid if enum-restricted
      level: "invalid-level-id",    // invalid ObjectId
    });

    expect(result.success).toBe(false);
  });
});