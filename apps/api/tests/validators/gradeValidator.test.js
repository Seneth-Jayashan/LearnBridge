import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import {
  createGradeSchema,
  updateGradeSchema,
} from "../../validators/GradeValidator.js";

describe("GradeValidator", () => {
  beforeEach(() => {
    // 🔄 Reset mocks (keeps consistency across tests)
    jest.clearAllMocks();
  });

  // ✅ POSITIVE TEST
  // ✔ Valid grade input should pass validation
  it("passes with valid input", () => {
    const result = createGradeSchema.safeParse({
      name: "Grade 8",
      description: "Middle school",
    });

    expect(result.success).toBe(true);
  });

  // ❌ NEGATIVE TEST
  // ✔ Missing required field (name)
  it("fails when required fields are missing", () => {
    const result = createGradeSchema.safeParse({
      description: "No name",
    });

    expect(result.success).toBe(false);
  });

  // ❌ NEGATIVE TEST
  // ✔ Invalid type (name should be string)
  it("fails when format/type is invalid", () => {
    const result = updateGradeSchema.safeParse({
      name: 123,
    });

    expect(result.success).toBe(false);
  });
});