/**
 * src/tests/unit/MyQuizzes.test.jsx
 *
 * Tests for the teacher's quiz management list (MyQuizzes.jsx)
 * Covers: rendering, loading, empty state, delete, publish, navigation
 */

import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

// ── Mock quizService ──────────────────────────────────────────────────
jest.mock("../../../services/QuizService.jsx", () => ({
  __esModule: true,
  default: {
    getTeacherQuizzes: jest.fn(),
    deleteQuiz:        jest.fn(),
    publishQuiz:       jest.fn(),
  },
}));

import quizService from "../../../services/QuizService.jsx";
import MyQuizzes   from "../../../components/teacher/quiz/MyQuizzes.jsx";

// ── Mock useNavigate ──────────────────────────────────────────────────
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

// ── Shared helpers ────────────────────────────────────────────────────
const renderMyQuizzes = () =>
  render(
    <MemoryRouter>
      <MyQuizzes />
    </MemoryRouter>
  );

// NOTE: Component sorts by createdAt descending (newest first).
// q2 has a later createdAt so it renders at index [0], q1 at index [1].
// Tests that click [0] will hit q2; tests that click [1] will hit q1.
// To keep assertions on q1 simple we put q1 AFTER q2 in createdAt so
// q1 sorts to [0] — achieved by giving q1 a later date than q2.
const fakeQuizzes = [
  {
    _id: "q1",
    title: "Algebra Basics",
    isPublished: false,
    questions: [{ questionText: "Q1" }],
    timeLimit: 30,
    // Later date → renders first (index 0)
    createdAt: new Date("2024-01-02").toISOString(),
  },
  {
    _id: "q2",
    title: "Physics 101",
    isPublished: true,
    questions: [{ questionText: "Q1" }, { questionText: "Q2" }],
    timeLimit: 45,
    // Earlier date → renders second (index 1)
    createdAt: new Date("2024-01-01").toISOString(),
  },
];

beforeEach(() => jest.clearAllMocks());

// ═════════════════════════════════════════════════════════════════════
// Rendering
// ═════════════════════════════════════════════════════════════════════
describe("MyQuizzes – rendering", () => {

  test("✅ shows loading spinner while fetching", () => {
    quizService.getTeacherQuizzes.mockReturnValue(new Promise(() => {}));
    renderMyQuizzes();
    expect(screen.getByText(/loading your quizzes/i)).toBeInTheDocument();
  });

  test("✅ renders quiz list after successful fetch", async () => {
    quizService.getTeacherQuizzes.mockResolvedValue(fakeQuizzes);
    renderMyQuizzes();

    await waitFor(() => {
      expect(screen.getByText("Algebra Basics")).toBeInTheDocument();
      expect(screen.getByText("Physics 101")).toBeInTheDocument();
    });
  });

  test("✅ shows draft badge for unpublished quiz", async () => {
    quizService.getTeacherQuizzes.mockResolvedValue(fakeQuizzes);
    renderMyQuizzes();

    await waitFor(() => {
      expect(screen.getByText("Draft")).toBeInTheDocument();
    });
  });

  test("✅ shows live badge for published quiz", async () => {
    quizService.getTeacherQuizzes.mockResolvedValue(fakeQuizzes);
    renderMyQuizzes();

    await waitFor(() => {
      expect(screen.getByText("Live")).toBeInTheDocument();
    });
  });

  test("✅ shows question count and time limit", async () => {
    quizService.getTeacherQuizzes.mockResolvedValue(fakeQuizzes);
    renderMyQuizzes();

    await waitFor(() => {
      expect(screen.getByText(/1 Questions/i)).toBeInTheDocument();
      expect(screen.getByText(/30 mins/i)).toBeInTheDocument();
    });
  });

  test("✅ shows empty state when no quizzes exist", async () => {
    quizService.getTeacherQuizzes.mockResolvedValue([]);
    renderMyQuizzes();

    await waitFor(() => {
      expect(screen.getByText(/no quizzes found/i)).toBeInTheDocument();
      expect(screen.getByText(/start creating/i)).toBeInTheDocument();
    });
  });

  test("❌ shows error message when fetch fails", async () => {
    quizService.getTeacherQuizzes.mockRejectedValue(new Error("Network error"));
    renderMyQuizzes();

    await waitFor(() => {
      expect(screen.getByText(/failed to load quizzes/i)).toBeInTheDocument();
    });
  });

  test("✅ shows Publish Now button only for draft quizzes", async () => {
    quizService.getTeacherQuizzes.mockResolvedValue(fakeQuizzes);
    renderMyQuizzes();

    await waitFor(() => {
      const publishBtns = screen.getAllByText(/publish now/i);
      expect(publishBtns).toHaveLength(1);
    });
  });

});

// ═════════════════════════════════════════════════════════════════════
// Delete
// ═════════════════════════════════════════════════════════════════════
describe("MyQuizzes – delete", () => {

  test("✅ deletes quiz and removes it from the list", async () => {
    quizService.getTeacherQuizzes.mockResolvedValue([...fakeQuizzes]);
    quizService.deleteQuiz.mockResolvedValue({ message: "Deleted" });
    window.confirm = jest.fn(() => true);

    renderMyQuizzes();
    await waitFor(() => screen.getByText("Algebra Basics"));

    // index [0] → q1 (Algebra Basics) because of createdAt sort above
    const deleteButtons = screen.getAllByTitle("Delete Quiz");
    await userEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(quizService.deleteQuiz).toHaveBeenCalledWith("q1");
      expect(screen.queryByText("Algebra Basics")).not.toBeInTheDocument();
    });
  });

  test("❌ does not delete when user cancels confirmation", async () => {
    quizService.getTeacherQuizzes.mockResolvedValue([...fakeQuizzes]);
    window.confirm = jest.fn(() => false);

    renderMyQuizzes();
    await waitFor(() => screen.getByText("Algebra Basics"));

    const deleteButtons = screen.getAllByTitle("Delete Quiz");
    await userEvent.click(deleteButtons[0]);

    expect(quizService.deleteQuiz).not.toHaveBeenCalled();
    expect(screen.getByText("Algebra Basics")).toBeInTheDocument();
  });

  test("❌ shows error toast when delete API fails", async () => {
    quizService.getTeacherQuizzes.mockResolvedValue([...fakeQuizzes]);
    quizService.deleteQuiz.mockRejectedValue(new Error("Delete failed"));
    window.confirm = jest.fn(() => true);

    renderMyQuizzes();
    await waitFor(() => screen.getByText("Algebra Basics"));

    const deleteButtons = screen.getAllByTitle("Delete Quiz");
    await userEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/failed to delete quiz/i)).toBeInTheDocument();
    });
  });

});

// ═════════════════════════════════════════════════════════════════════
// Publish
// ═════════════════════════════════════════════════════════════════════
describe("MyQuizzes – publish", () => {

  test("✅ publishes draft quiz and updates badge to Live", async () => {
    quizService.getTeacherQuizzes.mockResolvedValue([...fakeQuizzes]);
    quizService.publishQuiz.mockResolvedValue({ message: "Published" });

    renderMyQuizzes();
    await waitFor(() => screen.getByText("Draft"));

    await userEvent.click(screen.getByText(/publish now/i));

    await waitFor(() => {
      expect(quizService.publishQuiz).toHaveBeenCalledWith("q1");
      expect(screen.getAllByText("Live")).toHaveLength(2);
    });
  });

  test("❌ shows error toast when publish API fails", async () => {
    quizService.getTeacherQuizzes.mockResolvedValue([...fakeQuizzes]);
    quizService.publishQuiz.mockRejectedValue(new Error("Publish failed"));

    renderMyQuizzes();
    await waitFor(() => screen.getByText(/publish now/i));

    await userEvent.click(screen.getByText(/publish now/i));

    await waitFor(() => {
      expect(screen.getByText(/failed to publish quiz/i)).toBeInTheDocument();
    });
  });

});

// ═════════════════════════════════════════════════════════════════════
// Navigation
// ═════════════════════════════════════════════════════════════════════
describe("MyQuizzes – navigation", () => {

  test("✅ navigates to create quiz page", async () => {
    quizService.getTeacherQuizzes.mockResolvedValue([]);
    renderMyQuizzes();

    await waitFor(() => screen.getByText(/create quiz/i));
    await userEvent.click(screen.getAllByText(/create quiz/i)[0]);

    expect(mockNavigate).toHaveBeenCalledWith("/teacher/quiz/create");
  });

  test("✅ navigates to edit quiz page", async () => {
    quizService.getTeacherQuizzes.mockResolvedValue([...fakeQuizzes]);
    renderMyQuizzes();

    await waitFor(() => screen.getAllByTitle("Edit Quiz"));
    // index [0] → q1 (Algebra Basics) — newest first
    await userEvent.click(screen.getAllByTitle("Edit Quiz")[0]);

    expect(mockNavigate).toHaveBeenCalledWith("/teacher/quiz/edit/q1");
  });

  test("✅ navigates to analytics page", async () => {
    quizService.getTeacherQuizzes.mockResolvedValue([...fakeQuizzes]);
    renderMyQuizzes();

    await waitFor(() => screen.getAllByText("Analytics"));
    // index [0] → q1 (Algebra Basics) — newest first
    await userEvent.click(screen.getAllByText("Analytics")[0]);

    expect(mockNavigate).toHaveBeenCalledWith("/teacher/quiz/q1/results");
  });

});