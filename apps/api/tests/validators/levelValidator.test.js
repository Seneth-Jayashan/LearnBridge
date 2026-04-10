import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import {
  createLevelSchema,
  updateLevelSchema,
} from "../../validators/LevelValidator.js";

describe("LevelValidator", () => {
  beforeEach(() => {
    // 🔄 Reset mocks (consistency across tests)
    jest.clearAllMocks();
  });

  // ✅ POSITIVE TEST
  // ✔ Valid level input should pass validation
  it("passes with valid input", () => {
    const result = createLevelSchema.safeParse({
      name: "Primary Education",
      description: "Grades 1-5",
    });

    expect(result.success).toBe(true);
  });

  // ❌ NEGATIVE TEST
  // ✔ Missing required field (name)
  it("fails when required fields are missing", () => {
    const result = createLevelSchema.safeParse({
      description: "No level name",
    });

    expect(result.success).toBe(false);
  });

  // ❌ NEGATIVE TEST
  // ✔ Invalid type for name
  it("fails when format/type is invalid", () => {
    const result = updateLevelSchema.safeParse({
      name: 2026,
    });

    expect(result.success).toBe(false);
  });
});