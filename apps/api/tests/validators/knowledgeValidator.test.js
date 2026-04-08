import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import {
  createKnowledgeBaseSchema,
  updateKnowledgeBaseSchema,
} from "../../validators/KnowledgeBaseValidator.js";

describe("KnowledgeBaseValidator", () => {
  beforeEach(() => {
    // 🔄 Reset mocks (good practice consistency)
    jest.clearAllMocks();
  });

  // ✅ POSITIVE TEST
  // ✔ Valid input should pass and transform values correctly
  it("passes with valid input", () => {
    const result = createKnowledgeBaseSchema.safeParse({
      title: "Exam Tips",
      content: "Plan your revision schedule",
      category: "Study",
      isPublished: "yes", // should be transformed to boolean true
    });

    expect(result.success).toBe(true);

    // ✔ Check transformation logic
    expect(result.data.isPublished).toBe(true);
  });

  // ❌ NEGATIVE TEST
  // ✔ Missing required fields should fail
  it("fails when required fields are missing", () => {
    const result = createKnowledgeBaseSchema.safeParse({
      category: "Study",
    });

    expect(result.success).toBe(false);
  });

  // ❌ NEGATIVE TEST
  // ✔ Invalid value for enum/boolean conversion
  it("fails when format/type is invalid", () => {
    const result = updateKnowledgeBaseSchema.safeParse({
      isPublished: "maybe", // invalid value
    });

    expect(result.success).toBe(false);
  });
});