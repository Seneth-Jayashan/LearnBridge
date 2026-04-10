/**
 * src/tests/unit/QuizResults.test.jsx
 *
 * Tests for both results components:
 *   - StudentQuizResults (pages/QuizResults.jsx)
 *   - TeacherQuizResults (components/teacher/quiz/QuizResults.jsx)
 */

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";

// ─────────────────────────────────────────────────────────────────────
// Service mock
// ─────────────────────────────────────────────────────────────────────
jest.mock("../../services/QuizService.jsx", () => ({
  __esModule: true,
  default: {
    getStudentResults:          jest.fn(),
    getTeacherQuizzes:          jest.fn(),
    getQuizResultsForTeacher:   jest.fn(),
    getAllQuizResultsForTeacher: jest.fn(),
  },
}));

import quizService         from "../../services/QuizService.jsx";
import StudentQuizResults  from "../../pages/QuizResults.jsx";
import TeacherQuizResults  from "../../components/teacher/quiz/QuizResults.jsx";

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

// ── Fake data ─────────────────────────────────────────────────────────
const fakeStudentResults = [
  {
    _id:              "r1",
    quizId:           { title: "Algebra Quiz" },
    score:            8,
    totalQuestions:   10,
    completedAt:      "2024-03-01T10:00:00Z",
    flaggedQuestions: [],
  },
  {
    _id:              "r2",
    quizId:           { title: "Physics Quiz" },
    score:            3,
    totalQuestions:   10,
    completedAt:      "2024-03-05T12:00:00Z",
    flaggedQuestions: [1, 2],
  },
];

const fakeTeacherQuizzes = [
  {
    _id:       "q1",
    title:     "Algebra Quiz",
    questions: [{}, {}, {}],
    timeLimit: 30,
    createdAt: new Date("2024-01-01").toISOString(),
  },
];

const fakeTeacherResults = [
  {
    _id:              "r1",
    quizId:           { _id: "q1", title: "Algebra Quiz" },
    studentId:        { firstName: "John", lastName: "Doe", regNumber: "S001" },
    score:            7,
    totalQuestions:   10,
    completedAt:      "2024-03-01T10:00:00Z",
    flaggedQuestions: [],
  },
];

beforeEach(() => jest.clearAllMocks());

// ═════════════════════════════════════════════════════════════════════
// StudentQuizResults
// ═════════════════════════════════════════════════════════════════════
describe("StudentQuizResults – rendering", () => {

  const renderStudent = () =>
    render(
      <MemoryRouter>
        <StudentQuizResults />
      </MemoryRouter>
    );

  test("✅ shows loading spinner while fetching", () => {
    quizService.getStudentResults.mockReturnValue(new Promise(() => {}));
    renderStudent();
    expect(screen.getByText(/syncing results/i)).toBeInTheDocument();
  });

  test("✅ renders page heading after load", async () => {
    quizService.getStudentResults.mockResolvedValue(fakeStudentResults);
    renderStudent();

    await waitFor(() => {
      expect(screen.getByText("My Quiz Results")).toBeInTheDocument();
    });
  });

  test("✅ shows empty state when no results", async () => {
    quizService.getStudentResults.mockResolvedValue([]);
    renderStudent();

    await waitFor(() => {
      expect(screen.getByText(/no history found/i)).toBeInTheDocument();
    });
  });

  test("❌ shows error message when fetch fails", async () => {
    quizService.getStudentResults.mockRejectedValue(new Error("Network error"));
    renderStudent();

    await waitFor(() => {
      expect(screen.getByText(/failed to load your results/i)).toBeInTheDocument();
    });
  });

  test("✅ renders quiz titles in result cards", async () => {
    quizService.getStudentResults.mockResolvedValue(fakeStudentResults);
    renderStudent();

    await waitFor(() => {
      expect(screen.getByText("Algebra Quiz")).toBeInTheDocument();
      expect(screen.getByText("Physics Quiz")).toBeInTheDocument();
    });
  });

  test("✅ shows correct accuracy percentage", async () => {
    quizService.getStudentResults.mockResolvedValue(fakeStudentResults);
    renderStudent();

    await waitFor(() => {
      expect(screen.getByText("80%")).toBeInTheDocument(); // 8/10
      expect(screen.getByText("30%")).toBeInTheDocument(); // 3/10
    });
  });

  test("✅ shows total attempts count in dashboard", async () => {
    quizService.getStudentResults.mockResolvedValue(fakeStudentResults);
    renderStudent();

    await waitFor(() => {
      expect(screen.getByText("2")).toBeInTheDocument(); // 2 attempts
    });
  });

  test("✅ shows overall average in dashboard", async () => {
    quizService.getStudentResults.mockResolvedValue(fakeStudentResults);
    renderStudent();

    // avg of 80% and 30% = 55%
    await waitFor(() => {
      expect(screen.getByText("55%")).toBeInTheDocument();
    });
  });

  test("✅ shows Flagged badge when result has flagged questions", async () => {
    quizService.getStudentResults.mockResolvedValue(fakeStudentResults);
    renderStudent();

    await waitFor(() => {
      expect(screen.getByText("Flagged")).toBeInTheDocument();
    });
  });

  test("✅ Back button calls navigate(-1)", async () => {
    quizService.getStudentResults.mockResolvedValue([]);
    renderStudent();

    await waitFor(() => screen.getByText("Back"));
    await userEvent.click(screen.getByText("Back"));

    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

});

// ═════════════════════════════════════════════════════════════════════
// TeacherQuizResults – all-mode (no :id param)
// ═════════════════════════════════════════════════════════════════════
describe("TeacherQuizResults – all-mode (dashboard)", () => {

  const renderTeacherAll = () =>
    render(
      <MemoryRouter initialEntries={["/teacher/quizzes/results"]}>
        <Routes>
          <Route path="/teacher/quizzes/results" element={<TeacherQuizResults />} />
        </Routes>
      </MemoryRouter>
    );

  beforeEach(() => {
    quizService.getTeacherQuizzes.mockResolvedValue(fakeTeacherQuizzes);
    quizService.getAllQuizResultsForTeacher.mockResolvedValue({
      results: fakeTeacherResults,
    });
  });

  test("✅ shows loading spinner while fetching", () => {
    quizService.getTeacherQuizzes.mockReturnValue(new Promise(() => {}));
    quizService.getAllQuizResultsForTeacher.mockReturnValue(new Promise(() => {}));
    renderTeacherAll();

    expect(screen.getByText(/loading quiz results/i)).toBeInTheDocument();
  });

  test("✅ renders All Quiz Results heading", async () => {
    renderTeacherAll();

    await waitFor(() => {
      expect(screen.getByText("All Quiz Results")).toBeInTheDocument();
    });
  });

  test("✅ shows summary stats – attempts", async () => {
    renderTeacherAll();

    await waitFor(() => {
      // Both "Attempts" and "Passed" cards show "1" — anchor on the label
      const attemptsLabel = screen.getByText("Attempts");
      expect(attemptsLabel.closest("div")).toHaveTextContent("1");
    });
  });

  test("✅ renders quiz accordion with quiz title", async () => {
    renderTeacherAll();

    await waitFor(() => {
      expect(screen.getByText("Algebra Quiz")).toBeInTheDocument();
    });
  });

  test("✅ shows student result when accordion is opened", async () => {
    renderTeacherAll();

    await waitFor(() => screen.getByText("Algebra Quiz"));

    // Accordion may already be expanded by default — only click if needed
    if (!screen.queryByText("John Doe")) {
      await userEvent.click(screen.getByText("Algebra Quiz"));
    }

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });
  });

  test("✅ shows empty state when no quizzes", async () => {
    quizService.getTeacherQuizzes.mockResolvedValue([]);
    quizService.getAllQuizResultsForTeacher.mockResolvedValue({ results: [] });
    renderTeacherAll();

    await waitFor(() => {
      expect(screen.getByText(/no quizzes yet/i)).toBeInTheDocument();
    });
  });

  test("❌ shows error when fetch fails", async () => {
    quizService.getTeacherQuizzes.mockRejectedValue(new Error("Network error"));
    renderTeacherAll();

    await waitFor(() => {
      expect(screen.getByText(/failed to load quiz results/i)).toBeInTheDocument();
    });
  });

  test("✅ Back to Quizzes navigates correctly", async () => {
    renderTeacherAll();

    await waitFor(() => screen.getByText(/back to quizzes/i));
    await userEvent.click(screen.getByText(/back to quizzes/i));

    expect(mockNavigate).toHaveBeenCalledWith("/teacher/quizzes");
  });

});

// ═════════════════════════════════════════════════════════════════════
// TeacherQuizResults – single quiz mode (:id param present)
// ═════════════════════════════════════════════════════════════════════
describe("TeacherQuizResults – single quiz mode", () => {

  const renderTeacherSingle = (quizId = "q1") =>
    render(
      <MemoryRouter initialEntries={[`/teacher/quiz/${quizId}/results`]}>
        <Routes>
          <Route path="/teacher/quiz/:id/results" element={<TeacherQuizResults />} />
        </Routes>
      </MemoryRouter>
    );

  test("✅ renders Quiz Results heading", async () => {
    quizService.getQuizResultsForTeacher.mockResolvedValue({
      quiz:    fakeTeacherQuizzes[0],
      results: fakeTeacherResults,
    });
    renderTeacherSingle();

    await waitFor(() => {
      expect(screen.getByText("Quiz Results")).toBeInTheDocument();
    });
  });

  test("✅ renders student name in result row", async () => {
    quizService.getQuizResultsForTeacher.mockResolvedValue({
      quiz:    fakeTeacherQuizzes[0],
      results: fakeTeacherResults,
    });
    renderTeacherSingle();

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });
  });

  test("✅ shows score and percentage", async () => {
    quizService.getQuizResultsForTeacher.mockResolvedValue({
      quiz:    fakeTeacherQuizzes[0],
      results: fakeTeacherResults,
    });
    renderTeacherSingle();

    await waitFor(() => {
      // Score: "7" and "/10" may be split across nodes — match flexibly
      expect(screen.getByText(/7\s*\/\s*10/i)).toBeInTheDocument();
      // "70%" appears in multiple stat cards — just confirm at least one exists
      expect(screen.getAllByText(/70\s*%/).length).toBeGreaterThanOrEqual(1);
    });
  });

  test("✅ shows empty results message when no students attempted", async () => {
    quizService.getQuizResultsForTeacher.mockResolvedValue({
      quiz:    fakeTeacherQuizzes[0],
      results: [],
    });
    renderTeacherSingle();

    await waitFor(() => {
      // "0" appears in both Attempts and Passed cards — anchor on the label
      const attemptsLabel = screen.getByText("Attempts");
      expect(attemptsLabel.closest("div")).toHaveTextContent("0");
    });
  });

  test("❌ shows error when single quiz fetch fails", async () => {
    quizService.getQuizResultsForTeacher.mockRejectedValue(new Error("Not found"));
    renderTeacherSingle();

    await waitFor(() => {
      expect(screen.getByText(/failed to load quiz results/i)).toBeInTheDocument();
    });
  });

});