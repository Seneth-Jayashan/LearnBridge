/**
 * tests/unit/validators/QuizValidator.test.js
 *
 * Production-level unit tests for all three Zod schemas:
 *   createQuizSchema · updateQuizSchema · submitQuizSchema
 *
 * FIX: Zod v4 renamed `errors` → `issues` on the error object.
 *      We use `result.error.issues` throughout.
 */

import { createQuizSchema, updateQuizSchema, submitQuizSchema }
  from "../../../validators/QuizValidator.js";

const logTestEvent = (phase) => {
  const { currentTestName } = expect.getState();
  if (currentTestName) {
    console.log(`[${phase}] ${currentTestName}`);
  }
};

beforeEach(() => logTestEvent("START"));
afterEach(() => logTestEvent("END"));

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns the first Zod issue message whose path includes `field`.
 * Works for both Zod v3 (errors) and Zod v4 (issues).
 */
const errorFor = (result, field) => {
  // Zod v4 uses .issues; Zod v3 used .errors – support both
  const issues = result.error?.issues ?? result.error?.errors ?? [];
  return issues.find((e) => e.path.includes(field))?.message ?? null;
};

/** Minimal valid question reused across suites */
const validQuestion = {
  questionText:  "What is 2 + 2?",
  options:       ["1", "2", "3", "4"],
  correctAnswer: 3,
};

// ═════════════════════════════════════════════════════════════════════════════
// createQuizSchema
// ═════════════════════════════════════════════════════════════════════════════
describe("createQuizSchema", () => {

  const validPayload = () => ({
    title:     "Algebra Basics",
    moduleId:  "64f1a2b3c4d5e6f7a8b9c0d1",
    questions: [validQuestion],
    timeLimit: 30,
  });

  // ── Positive ──────────────────────────────────────────────────────────────

  test("✅ accepts a fully valid payload", () => {
    const result = createQuizSchema.safeParse(validPayload());
    expect(result.success).toBe(true);
  });

  test("✅ accepts optional isPublished = true", () => {
    const result = createQuizSchema.safeParse({ ...validPayload(), isPublished: true });
    expect(result.success).toBe(true);
    expect(result.data.isPublished).toBe(true);
  });

  test("✅ accepts optional isPublished = false", () => {
    const result = createQuizSchema.safeParse({ ...validPayload(), isPublished: false });
    expect(result.success).toBe(true);
  });

  test("✅ accepts multiple valid questions", () => {
    const questions = Array.from({ length: 5 }, () => ({ ...validQuestion }));
    const result    = createQuizSchema.safeParse({ ...validPayload(), questions });
    expect(result.success).toBe(true);
    expect(result.data.questions).toHaveLength(5);
  });

  test("✅ correctAnswer boundary – 0 is valid", () => {
    const result = createQuizSchema.safeParse({
      ...validPayload(),
      questions: [{ ...validQuestion, correctAnswer: 0 }],
    });
    expect(result.success).toBe(true);
  });

  test("✅ correctAnswer boundary – 3 is valid", () => {
    const result = createQuizSchema.safeParse({
      ...validPayload(),
      questions: [{ ...validQuestion, correctAnswer: 3 }],
    });
    expect(result.success).toBe(true);
  });

  // ── Negative: top-level fields ─────────────────────────────────────────────

  test("❌ rejects missing title", () => {
    const { title: _, ...payload } = validPayload();
    expect(createQuizSchema.safeParse(payload).success).toBe(false);
  });

  test("❌ rejects empty title string", () => {
    const result = createQuizSchema.safeParse({ ...validPayload(), title: "" });
    expect(result.success).toBe(false);
    // message check is a bonus – don't fail if Zod wording changes
    const msg = errorFor(result, "title");
    if (msg) expect(msg).toMatch(/required|empty|least/i);
  });

  test("❌ rejects missing moduleId", () => {
    const { moduleId: _, ...payload } = validPayload();
    expect(createQuizSchema.safeParse(payload).success).toBe(false);
  });

  test("❌ rejects timeLimit = 0", () => {
    const result = createQuizSchema.safeParse({ ...validPayload(), timeLimit: 0 });
    expect(result.success).toBe(false);
    const msg = errorFor(result, "timeLimit");
    if (msg) expect(msg).toMatch(/positive/i);
  });

  test("❌ rejects negative timeLimit", () => {
    expect(createQuizSchema.safeParse({ ...validPayload(), timeLimit: -5 }).success).toBe(false);
  });

  test("❌ rejects non-integer timeLimit", () => {
    expect(createQuizSchema.safeParse({ ...validPayload(), timeLimit: 1.5 }).success).toBe(false);
  });

  test("❌ rejects empty questions array", () => {
    expect(createQuizSchema.safeParse({ ...validPayload(), questions: [] }).success).toBe(false);
  });

  // ── Negative: question-level fields ───────────────────────────────────────

  test("❌ rejects question with empty questionText", () => {
    const result = createQuizSchema.safeParse({
      ...validPayload(),
      questions: [{ ...validQuestion, questionText: "" }],
    });
    expect(result.success).toBe(false);
    const msg = errorFor(result, "questionText");
    if (msg) expect(msg).toMatch(/required|empty|least/i);
  });

  test("❌ rejects question with 3 options (must be exactly 4)", () => {
    const result = createQuizSchema.safeParse({
      ...validPayload(),
      questions: [{ ...validQuestion, options: ["a", "b", "c"] }],
    });
    expect(result.success).toBe(false);
    const msg = errorFor(result, "options");
    if (msg) expect(msg).toMatch(/4/i);
  });

  test("❌ rejects question with 5 options", () => {
    const result = createQuizSchema.safeParse({
      ...validPayload(),
      questions: [{ ...validQuestion, options: ["a","b","c","d","e"] }],
    });
    expect(result.success).toBe(false);
  });

  test("❌ rejects question with an empty option string", () => {
    const result = createQuizSchema.safeParse({
      ...validPayload(),
      questions: [{ ...validQuestion, options: ["a", "", "c", "d"] }],
    });
    expect(result.success).toBe(false);
  });

  test("❌ rejects correctAnswer = -1 (below 0)", () => {
    const result = createQuizSchema.safeParse({
      ...validPayload(),
      questions: [{ ...validQuestion, correctAnswer: -1 }],
    });
    expect(result.success).toBe(false);
    const msg = errorFor(result, "correctAnswer");
    if (msg) expect(msg).toMatch(/0|least/i);
  });

  test("❌ rejects correctAnswer = 4 (above 3)", () => {
    const result = createQuizSchema.safeParse({
      ...validPayload(),
      questions: [{ ...validQuestion, correctAnswer: 4 }],
    });
    expect(result.success).toBe(false);
    const msg = errorFor(result, "correctAnswer");
    if (msg) expect(msg).toMatch(/3|most/i);
  });

  test("❌ rejects float correctAnswer (must be integer)", () => {
    const result = createQuizSchema.safeParse({
      ...validPayload(),
      questions: [{ ...validQuestion, correctAnswer: 1.5 }],
    });
    expect(result.success).toBe(false);
  });

});

// ═════════════════════════════════════════════════════════════════════════════
// updateQuizSchema
// ═════════════════════════════════════════════════════════════════════════════
describe("updateQuizSchema", () => {

  // ── Positive ──────────────────────────────────────────────────────────────

  test("✅ accepts empty object (all fields optional)", () => {
    expect(updateQuizSchema.safeParse({}).success).toBe(true);
  });

  test("✅ accepts partial update with title only", () => {
    expect(updateQuizSchema.safeParse({ title: "New Name" }).success).toBe(true);
  });

  test("✅ accepts partial update with isPublished only", () => {
    expect(updateQuizSchema.safeParse({ isPublished: true }).success).toBe(true);
  });

  test("✅ accepts full payload", () => {
    const result = updateQuizSchema.safeParse({
      title:       "Updated",
      moduleId:    "mod999",
      questions:   [validQuestion],
      timeLimit:   45,
      isPublished: false,
    });
    expect(result.success).toBe(true);
  });

  // ── Negative ──────────────────────────────────────────────────────────────

  test("❌ rejects empty title string if title is provided", () => {
    const result = updateQuizSchema.safeParse({ title: "" });
    expect(result.success).toBe(false);
    const msg = errorFor(result, "title");
    if (msg) expect(msg).toMatch(/empty|least|required/i);
  });

  test("❌ rejects non-positive timeLimit if provided", () => {
    expect(updateQuizSchema.safeParse({ timeLimit: 0 }).success).toBe(false);
  });

  test("❌ rejects empty questions array if provided", () => {
    expect(updateQuizSchema.safeParse({ questions: [] }).success).toBe(false);
  });

  test("❌ rejects invalid question inside update", () => {
    expect(
      updateQuizSchema.safeParse({ questions: [{ ...validQuestion, correctAnswer: 10 }] }).success
    ).toBe(false);
  });

});

// ═════════════════════════════════════════════════════════════════════════════
// submitQuizSchema
// ═════════════════════════════════════════════════════════════════════════════
describe("submitQuizSchema", () => {

  // ── Positive ──────────────────────────────────────────────────────────────

  test("✅ accepts all-correct integer answers", () => {
    expect(submitQuizSchema.safeParse({ answers: [0, 1, 2, 3] }).success).toBe(true);
  });

  test("✅ accepts null answers (skipped questions)", () => {
    expect(submitQuizSchema.safeParse({ answers: [null, 1, null] }).success).toBe(true);
  });

  test("✅ accepts flaggedQuestions as optional empty array", () => {
    expect(
      submitQuizSchema.safeParse({ answers: [0], flaggedQuestions: [] }).success
    ).toBe(true);
  });

  test("✅ accepts populated flaggedQuestions", () => {
    expect(
      submitQuizSchema.safeParse({ answers: [0, 1], flaggedQuestions: [0, 1] }).success
    ).toBe(true);
  });

  test("✅ boundary – answer value 0 is valid", () => {
    expect(submitQuizSchema.safeParse({ answers: [0] }).success).toBe(true);
  });

  test("✅ boundary – answer value 3 is valid", () => {
    expect(submitQuizSchema.safeParse({ answers: [3] }).success).toBe(true);
  });

  // ── Negative ──────────────────────────────────────────────────────────────

  test("❌ rejects empty answers array", () => {
    expect(submitQuizSchema.safeParse({ answers: [] }).success).toBe(false);
  });

  test("❌ rejects answer index -1 (below 0)", () => {
    const result = submitQuizSchema.safeParse({ answers: [-1] });
    expect(result.success).toBe(false);
    const msg = errorFor(result, "answers");
    if (msg) expect(msg).toMatch(/0|least/i);
  });

  test("❌ rejects answer index 4 (above 3)", () => {
    const result = submitQuizSchema.safeParse({ answers: [4] });
    expect(result.success).toBe(false);
    const msg = errorFor(result, "answers");
    if (msg) expect(msg).toMatch(/3|most/i);
  });

  test("❌ rejects float answer (must be integer)", () => {
    expect(submitQuizSchema.safeParse({ answers: [1.5] }).success).toBe(false);
  });

  test("❌ rejects string inside answers array", () => {
    expect(submitQuizSchema.safeParse({ answers: ["0"] }).success).toBe(false);
  });

  test("❌ rejects missing answers field entirely", () => {
    expect(submitQuizSchema.safeParse({ flaggedQuestions: [0] }).success).toBe(false);
  });

  test("❌ rejects negative flaggedQuestions index", () => {
    expect(
      submitQuizSchema.safeParse({ answers: [0], flaggedQuestions: [-1] }).success
    ).toBe(false);
  });

  test("❌ rejects float in flaggedQuestions", () => {
    expect(
      submitQuizSchema.safeParse({ answers: [0], flaggedQuestions: [0.5] }).success
    ).toBe(false);
  });

});