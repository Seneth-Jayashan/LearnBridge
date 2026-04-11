/**
 * tests/unit/models/Quiz.model.test.js
 *
 * Production-level unit tests for Quiz & QuizResult Mongoose schemas.
 *
 * FIX: Mongoose v9 removed the callback form of validate().
 *      We now use the promise form:  await doc.validate()
 *      which throws a ValidationError on failure, or resolves void on success.
 */

import mongoose from "mongoose";

const logTestEvent = (phase) => {
  const { currentTestName } = expect.getState();
  if (currentTestName) {
    console.log(`[${phase}] ${currentTestName}`);
  }
};

beforeEach(() => logTestEvent("START"));
afterEach(() => logTestEvent("END"));

// ─────────────────────────────────────────────────────────────────────────────
// Inline schema replicas – no real DB connection needed
// ─────────────────────────────────────────────────────────────────────────────

const questionSchema = new mongoose.Schema({
  questionText:  { type: String,  required: true },
  options:       [{ type: String, required: true }],
  correctAnswer: { type: Number,  required: true },
  isFlagged:     { type: Boolean, default: false },
});

const quizSchema = new mongoose.Schema(
  {
    title:       { type: String,  required: true, trim: true },
    moduleId:    { type: mongoose.Schema.Types.ObjectId, ref: "Module", required: true },
    createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: "User",   required: true },
    questions:   [questionSchema],
    timeLimit:   { type: Number,  required: true },
    isPublished: { type: Boolean, default: false },
    isDeleted:   { type: Boolean, default: false },
  },
  { timestamps: true },
);

const quizResultSchema = new mongoose.Schema(
  {
    quizId:           { type: mongoose.Schema.Types.ObjectId, ref: "Quiz", required: true },
    studentId:        { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    answers:          [{ type: Number }],
    flaggedQuestions: [{ type: Number }],
    score:            { type: Number },
    totalQuestions:   { type: Number },
    completedAt:      { type: Date, default: Date.now },
    isDeleted:        { type: Boolean, default: false },
  },
  { timestamps: true },
);

// Unique model names so Jest isolation doesn't clash across runs
const TestQuiz       = mongoose.model("TestQuiz",       quizSchema);
const TestQuizResult = mongoose.model("TestQuizResult", quizResultSchema);

// ─────────────────────────────────────────────────────────────────────────────
// Helper – Mongoose v9: validate() is promise-only, throws on failure
//
//   returns null     → document is valid
//   returns the error → document is invalid
// ─────────────────────────────────────────────────────────────────────────────
const validate = async (doc) => {
  try {
    await doc.validate();
    return null;            // no error → valid
  } catch (err) {
    return err;             // ValidationError → invalid
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// Quiz Schema
// ═════════════════════════════════════════════════════════════════════════════
describe("Quiz model – schema validation", () => {

  const validQuizData = () => ({
    title:     "Physics 101",
    moduleId:  new mongoose.Types.ObjectId(),
    createdBy: new mongoose.Types.ObjectId(),
    questions: [
      {
        questionText:  "What is gravity?",
        options:       ["A force", "A particle", "A wave", "None"],
        correctAnswer: 0,
      },
    ],
    timeLimit: 20,
  });

  // ── Positive ──────────────────────────────────────────────────────────────

  test("✅ valid quiz passes schema validation", async () => {
    const doc = new TestQuiz(validQuizData());
    const err = await validate(doc);
    expect(err).toBeNull();
  });

  test("✅ isPublished defaults to false", () => {
    const doc = new TestQuiz(validQuizData());
    expect(doc.isPublished).toBe(false);
  });

  test("✅ isDeleted defaults to false", () => {
    const doc = new TestQuiz(validQuizData());
    expect(doc.isDeleted).toBe(false);
  });

  test("✅ isFlagged on question defaults to false", () => {
    const doc = new TestQuiz(validQuizData());
    expect(doc.questions[0].isFlagged).toBe(false);
  });

  test("✅ title is trimmed by Mongoose", () => {
    const doc = new TestQuiz({ ...validQuizData(), title: "  Trimmed  " });
    expect(doc.title).toBe("Trimmed");
  });

  test("✅ quiz with zero questions is accepted by schema (business rule enforced in Zod)", async () => {
    // The Mongoose schema has no min-1 constraint on the questions array —
    // that guard lives in the Zod validator. Schema validation must still pass.
    const doc = new TestQuiz({ ...validQuizData(), questions: [] });
    const err = await validate(doc);
    expect(err).toBeNull();
  });

  // ── Negative ──────────────────────────────────────────────────────────────

  test("❌ missing title causes validation error", async () => {
    const { title: _, ...data } = validQuizData();
    const doc = new TestQuiz(data);
    const err = await validate(doc);
    expect(err).not.toBeNull();
    expect(err.errors.title).toBeDefined();
  });

  test("❌ missing moduleId causes validation error", async () => {
    const { moduleId: _, ...data } = validQuizData();
    const doc = new TestQuiz(data);
    const err = await validate(doc);
    expect(err).not.toBeNull();
    expect(err.errors.moduleId).toBeDefined();
  });

  test("❌ missing createdBy causes validation error", async () => {
    const { createdBy: _, ...data } = validQuizData();
    const doc = new TestQuiz(data);
    const err = await validate(doc);
    expect(err).not.toBeNull();
    expect(err.errors.createdBy).toBeDefined();
  });

  test("❌ missing timeLimit causes validation error", async () => {
    const { timeLimit: _, ...data } = validQuizData();
    const doc = new TestQuiz(data);
    const err = await validate(doc);
    expect(err).not.toBeNull();
    expect(err.errors.timeLimit).toBeDefined();
  });

  test("❌ missing questionText inside question causes validation error", async () => {
    const data = validQuizData();
    data.questions[0] = { options: ["a","b","c","d"], correctAnswer: 0 };
    const doc = new TestQuiz(data);
    const err = await validate(doc);
    expect(err).not.toBeNull();
  });

  test("❌ missing correctAnswer inside question causes validation error", async () => {
    const data = validQuizData();
    data.questions[0] = { questionText: "Q?", options: ["a","b","c","d"] };
    const doc = new TestQuiz(data);
    const err = await validate(doc);
    expect(err).not.toBeNull();
  });

});

// ═════════════════════════════════════════════════════════════════════════════
// QuizResult Schema
// ═════════════════════════════════════════════════════════════════════════════
describe("QuizResult model – schema validation", () => {

  const validResultData = () => ({
    quizId:           new mongoose.Types.ObjectId(),
    studentId:        new mongoose.Types.ObjectId(),
    answers:          [0, 1, 2],
    flaggedQuestions: [1],
    score:            2,
    totalQuestions:   3,
  });

  // ── Positive ──────────────────────────────────────────────────────────────

  test("✅ valid result passes schema validation", async () => {
    const doc = new TestQuizResult(validResultData());
    const err = await validate(doc);
    expect(err).toBeNull();
  });

  test("✅ completedAt defaults to now", () => {
    const before = Date.now();
    const doc    = new TestQuizResult(validResultData());
    const after  = Date.now();
    expect(doc.completedAt.getTime()).toBeGreaterThanOrEqual(before);
    expect(doc.completedAt.getTime()).toBeLessThanOrEqual(after);
  });

  test("✅ isDeleted defaults to false", () => {
    const doc = new TestQuizResult(validResultData());
    expect(doc.isDeleted).toBe(false);
  });

  test("✅ accepts score of 0 (all wrong)", async () => {
    const doc = new TestQuizResult({ ...validResultData(), score: 0 });
    const err = await validate(doc);
    expect(err).toBeNull();
  });

  test("✅ accepts empty flaggedQuestions array", async () => {
    const doc = new TestQuizResult({ ...validResultData(), flaggedQuestions: [] });
    const err = await validate(doc);
    expect(err).toBeNull();
  });

  // ── Negative ──────────────────────────────────────────────────────────────

  test("❌ missing quizId causes validation error", async () => {
    const { quizId: _, ...data } = validResultData();
    const doc = new TestQuizResult(data);
    const err = await validate(doc);
    expect(err).not.toBeNull();
    expect(err.errors.quizId).toBeDefined();
  });

  test("❌ missing studentId causes validation error", async () => {
    const { studentId: _, ...data } = validResultData();
    const doc = new TestQuizResult(data);
    const err = await validate(doc);
    expect(err).not.toBeNull();
    expect(err.errors.studentId).toBeDefined();
  });

});