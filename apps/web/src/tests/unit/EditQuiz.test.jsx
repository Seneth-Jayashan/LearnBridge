/**
 * src/tests/unit/EditQuiz.test.jsx
 *
 * Tests for the teacher quiz edit form (EditQuiz.jsx)
 * Covers: loading, data population, validation, save, navigation
 */

import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";

// ── Service mocks ─────────────────────────────────────────────────────
jest.mock("../../../services/QuizService.jsx", () => ({
  __esModule: true,
  default: {
    getTeacherQuizzes: jest.fn(),
    updateQuiz:        jest.fn(),
  },
}));

jest.mock("../../../services/ModuleService", () => ({
  __esModule: true,
  default: { getAllModules: jest.fn() },
}));

import quizService   from "../../../services/QuizService.jsx";
import moduleService from "../../../services/ModuleService";
import EditQuiz      from "../../../components/teacher/quiz/EditQuiz.jsx";

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

// ── Helpers ───────────────────────────────────────────────────────────
const fakeModules = [
  { _id: "mod1", name: "Algebra", grade: { name: "10" }, level: { name: "Ordinary" } },
];

const fakeQuiz = {
  _id: "quiz1",
  title: "Existing Quiz",
  moduleId: "mod1",
  timeLimit: 20,
  questions: [
    {
      questionText: "What is 2+2?",
      options: ["1", "2", "3", "4"],
      correctAnswer: 3,
    },
  ],
};

const renderEditQuiz = (quizId = "quiz1") =>
  render(
    <MemoryRouter initialEntries={[`/teacher/quiz/edit/${quizId}`]}>
      <Routes>
        <Route path="/teacher/quiz/edit/:id" element={<EditQuiz />} />
      </Routes>
    </MemoryRouter>
  );

beforeEach(() => {
  jest.clearAllMocks();
  moduleService.getAllModules.mockResolvedValue(fakeModules);
  quizService.getTeacherQuizzes.mockResolvedValue([fakeQuiz]);
});

// ═══════════════════════════════════════════════════════════════════
// Loading & initial population
// ═══════════════════════════════════════════════════════════════════
describe("EditQuiz – loading & data population", () => {

  test("✅ shows loading state initially", () => {
    quizService.getTeacherQuizzes.mockReturnValue(new Promise(() => {}));
    renderEditQuiz();

    expect(screen.getByText(/loading quiz details/i)).toBeInTheDocument();
  });

  test("✅ populates title from existing quiz data", async () => {
    renderEditQuiz();

    await waitFor(() => {
      expect(screen.getByDisplayValue("Existing Quiz")).toBeInTheDocument();
    });
  });

  test("✅ populates existing question text", async () => {
    renderEditQuiz();

    await waitFor(() => {
      expect(screen.getByDisplayValue("What is 2+2?")).toBeInTheDocument();
    });
  });

  test("✅ populates existing options", async () => {
    renderEditQuiz();

    await waitFor(() => {
      expect(screen.getByDisplayValue("1")).toBeInTheDocument();
      expect(screen.getByDisplayValue("4")).toBeInTheDocument();
    });
  });

  test("❌ shows error when quiz is not found", async () => {
    quizService.getTeacherQuizzes.mockResolvedValue([]);
    renderEditQuiz("nonexistent");

    await waitFor(() => {
      expect(screen.getByText(/quiz not found/i)).toBeInTheDocument();
    });
  });

  test("❌ shows error when quiz fetch fails", async () => {
    quizService.getTeacherQuizzes.mockRejectedValue(new Error("Network error"));
    renderEditQuiz();

    await waitFor(() => {
      expect(screen.getByText(/failed to load quiz details/i)).toBeInTheDocument();
    });
  });

});

// ═══════════════════════════════════════════════════════════════════
// Form validation
// ═══════════════════════════════════════════════════════════════════
describe("EditQuiz – form validation", () => {

  test("❌ shows error when title is cleared before saving", async () => {
    renderEditQuiz();
    await waitFor(() => screen.getByDisplayValue("Existing Quiz"));

    await userEvent.clear(screen.getByDisplayValue("Existing Quiz"));
    await userEvent.click(screen.getAllByText(/save changes/i)[0]);

    expect(screen.getByText(/quiz title is required/i)).toBeInTheDocument();
    expect(quizService.updateQuiz).not.toHaveBeenCalled();
  });

  test("❌ shows error when module is deselected", async () => {
    renderEditQuiz();
    await waitFor(() => screen.getByDisplayValue("Existing Quiz"));

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "" } });
    await userEvent.click(screen.getAllByText(/save changes/i)[0]);

    expect(screen.getByText(/please select a module/i)).toBeInTheDocument();
  });

  test("❌ shows error when question text is empty", async () => {
    renderEditQuiz();
    await waitFor(() => screen.getByDisplayValue("What is 2+2?"));

    await userEvent.clear(screen.getByDisplayValue("What is 2+2?"));
    await userEvent.click(screen.getAllByText(/save changes/i)[0]);

    await waitFor(() => {
      expect(screen.getByText(/question 1 text is empty/i)).toBeInTheDocument();
    });
  });

});

// ═══════════════════════════════════════════════════════════════════
// Save & navigation
// ═══════════════════════════════════════════════════════════════════
describe("EditQuiz – save & navigation", () => {

  test("✅ saves quiz and navigates to quiz list", async () => {
    quizService.updateQuiz.mockResolvedValue({ message: "Updated" });
    renderEditQuiz();
    await waitFor(() => screen.getByDisplayValue("Existing Quiz"));

    await userEvent.click(screen.getAllByText(/save changes/i)[0]);

    await waitFor(() => {
      expect(quizService.updateQuiz).toHaveBeenCalledWith(
        "quiz1",
        expect.objectContaining({ title: "Existing Quiz" }),
      );
    });

    await waitFor(
      () => expect(mockNavigate).toHaveBeenCalledWith("/teacher/quizzes"),
      { timeout: 1500 },
    );
  });

  test("✅ shows success toast after saving", async () => {
    quizService.updateQuiz.mockResolvedValue({});
    renderEditQuiz();
    await waitFor(() => screen.getByDisplayValue("Existing Quiz"));

    await userEvent.click(screen.getAllByText(/save changes/i)[0]);

    await waitFor(() => {
      expect(screen.getByText(/quiz updated successfully/i)).toBeInTheDocument();
    });
  });

  test("❌ shows error toast when update fails", async () => {
    quizService.updateQuiz.mockRejectedValue({
      response: { data: { message: "Update failed" } },
    });
    renderEditQuiz();
    await waitFor(() => screen.getByDisplayValue("Existing Quiz"));

    await userEvent.click(screen.getAllByText(/save changes/i)[0]);

    await waitFor(() => {
      expect(screen.getByText(/failed to update quiz/i)).toBeInTheDocument();
    });
  });

  test("✅ disables save button while saving", async () => {
    quizService.updateQuiz.mockReturnValue(new Promise(() => {}));
    renderEditQuiz();
    await waitFor(() => screen.getByDisplayValue("Existing Quiz"));

    await userEvent.click(screen.getAllByText(/save changes/i)[0]);

    await waitFor(() => {
      // Two "Saving..." buttons exist (header + bottom bar) — both should be disabled
      const savingBtns = screen.getAllByText("Saving...");
      expect(savingBtns.length).toBeGreaterThanOrEqual(1);
      savingBtns.forEach(btn => expect(btn).toBeDisabled());
    });
  });

  test("✅ Cancel navigates to quiz list without saving", async () => {
    renderEditQuiz();
    await waitFor(() => screen.getByText("Cancel"));

    await userEvent.click(screen.getByText("Cancel"));

    expect(mockNavigate).toHaveBeenCalledWith("/teacher/quizzes");
    expect(quizService.updateQuiz).not.toHaveBeenCalled();
  });

});

// ═══════════════════════════════════════════════════════════════════
// Question management
// ═══════════════════════════════════════════════════════════════════
describe("EditQuiz – question management", () => {

  test("✅ adds a new question", async () => {
    renderEditQuiz();
    await waitFor(() => screen.getByText("Question 1"));

    await userEvent.click(screen.getByText(/\+ add question/i));

    expect(screen.getByText("Question 2")).toBeInTheDocument();
  });

  test("✅ removes a question", async () => {
    renderEditQuiz();
    await waitFor(() => screen.getByText("Question 1"));

    await userEvent.click(screen.getByText(/\+ add question/i));
    expect(screen.getByText("Question 2")).toBeInTheDocument();

    const removeButtons = screen.getAllByText(/✕ remove/i);
    await userEvent.click(removeButtons[0]);

    await waitFor(() => {
      expect(screen.queryByText("Question 2")).not.toBeInTheDocument();
    });
  });

});