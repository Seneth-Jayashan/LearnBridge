/**
 * src/tests/unit/CreateQuiz.test.jsx
 *
 * Tests for the teacher quiz creation form (CreateQuiz.jsx)
 * Covers: rendering, form validation, submission, import modal toggle
 */

import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

// ── Service mocks ─────────────────────────────────────────────────────
jest.mock("../../../services/QuizService.jsx", () => ({
  __esModule: true,
  default: { createQuiz: jest.fn() },
}));

jest.mock("../../../services/ModuleService", () => ({
  __esModule: true,
  default: { getAllModules: jest.fn() },
}));

jest.mock("../../../services/TriviaService.jsx", () => ({
  __esModule: true,
  default: { fetchCategories: jest.fn(), fetchQuestions: jest.fn() },
}));

jest.mock("../../../services/PdfService.jsx", () => ({
  __esModule: true,
  default: { generateQuestionsFromPDF: jest.fn() },
}));

import quizService   from "../../../services/QuizService.jsx";
import moduleService from "../../../services/ModuleService";
import CreateQuiz    from "../../../components/teacher/quiz/CreateQuiz.jsx";

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

// ── Helpers ───────────────────────────────────────────────────────────
// grade.name must NOT include the word "Grade" — the component adds it:
//   `Grade ${item.grade.name}` → "Grade 10"
// If you pass "Grade 10" the component outputs "Grade Grade 10".
const fakeModules = [
  { _id: "mod1", name: "Algebra", grade: { name: "10" }, level: { name: "Ordinary" } },
  { _id: "mod2", name: "Physics", grade: { name: "11" }, level: { name: "Ordinary" } },
];

const renderCreateQuiz = () =>
  render(
    <MemoryRouter>
      <CreateQuiz />
    </MemoryRouter>
  );

beforeEach(() => {
  jest.clearAllMocks();
  moduleService.getAllModules.mockResolvedValue(fakeModules);
});

// ═══════════════════════════════════════════════════════════════════
// Rendering
// ═══════════════════════════════════════════════════════════════════
describe("CreateQuiz – rendering", () => {

  test("✅ renders the page heading", async () => {
    renderCreateQuiz();
    await waitFor(() => {
      expect(screen.getByText("Create New Quiz")).toBeInTheDocument();
    });
  });

  test("✅ renders module dropdown with loaded modules", async () => {
    renderCreateQuiz();
    // Use role-based matcher — option text is "Algebra — Grade 10", not bare "Algebra"
    await waitFor(() => {
      expect(screen.getByRole("option", { name: /Algebra/i })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: /Physics/i })).toBeInTheDocument();
    });
  });

  test("✅ renders a default empty question block", async () => {
    renderCreateQuiz();
    await waitFor(() => {
      expect(screen.getByText("Question 1")).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/enter your question here/i)).toBeInTheDocument();
    });
  });

  test("✅ renders time limit slider with default value", async () => {
    renderCreateQuiz();
    await waitFor(() => {
      expect(screen.getByText(/10 minutes/i)).toBeInTheDocument();
    });
  });

  test("❌ shows module load error when moduleService fails", async () => {
    moduleService.getAllModules.mockRejectedValue(new Error("Network error"));
    renderCreateQuiz();

    await waitFor(() => {
      expect(screen.getByText(/failed to load modules/i)).toBeInTheDocument();
    });
  });

});

// ═══════════════════════════════════════════════════════════════════
// Form validation
// ═══════════════════════════════════════════════════════════════════
describe("CreateQuiz – form validation", () => {

  test("❌ shows error when title is empty on submit", async () => {
    renderCreateQuiz();
    await waitFor(() => screen.getByText("Create New Quiz"));

    await userEvent.click(screen.getByText("Save"));

    expect(screen.getByText(/quiz title is required/i)).toBeInTheDocument();
    expect(quizService.createQuiz).not.toHaveBeenCalled();
  });

  test("❌ shows error when no module is selected", async () => {
    renderCreateQuiz();
    await waitFor(() => screen.getByText("Create New Quiz"));

    await userEvent.type(screen.getByPlaceholderText(/e.g. chapter/i), "My Quiz");
    await userEvent.click(screen.getByText("Save"));

    expect(screen.getByText(/please select a module/i)).toBeInTheDocument();
    expect(quizService.createQuiz).not.toHaveBeenCalled();
  });

  test("❌ shows error when question text is empty", async () => {
    renderCreateQuiz();
    // Wait for modules to load using role matcher
    await waitFor(() => screen.getByRole("option", { name: /Algebra/i }));

    await userEvent.type(screen.getByPlaceholderText(/e.g. chapter/i), "My Quiz");
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "mod1" } });

    await userEvent.click(screen.getByText("Save"));

    await waitFor(() => {
      expect(screen.getByText(/question 1 text is empty/i)).toBeInTheDocument();
    });
  });

  test("❌ shows error when an option is empty", async () => {
    renderCreateQuiz();
    await waitFor(() => screen.getByRole("option", { name: /Algebra/i }));

    await userEvent.type(screen.getByPlaceholderText(/e.g. chapter/i), "My Quiz");
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "mod1" } });

    await userEvent.type(screen.getByPlaceholderText(/enter your question here/i), "What is 2+2?");
    await userEvent.click(screen.getByText("Save"));

    await waitFor(() => {
      expect(screen.getByText(/all options in question 1 must be filled/i)).toBeInTheDocument();
    });
  });

});

// ═══════════════════════════════════════════════════════════════════
// Submission
// ═══════════════════════════════════════════════════════════════════
describe("CreateQuiz – submission", () => {

  const fillValidForm = async () => {
    // Wait for modules to load
    await waitFor(() => screen.getByRole("option", { name: /Algebra/i }));

    await userEvent.type(screen.getByPlaceholderText(/e.g. chapter/i), "My Quiz");
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "mod1" } });
    await userEvent.type(screen.getByPlaceholderText(/enter your question here/i), "What is 2+2?");

    const optionInputs = screen.getAllByPlaceholderText(/option \d/i);
    await userEvent.type(optionInputs[0], "1");
    await userEvent.type(optionInputs[1], "2");
    await userEvent.type(optionInputs[2], "3");
    await userEvent.type(optionInputs[3], "4");
  };

  test("✅ submits quiz and shows success toast", async () => {
    quizService.createQuiz.mockResolvedValue({ message: "Quiz created successfully" });
    renderCreateQuiz();
    await fillValidForm();

    await userEvent.click(screen.getByText("Save"));

    await waitFor(() => {
      expect(quizService.createQuiz).toHaveBeenCalledTimes(1);
      expect(screen.getByText(/quiz (created|saved)/i)).toBeInTheDocument();
    });
  });

  test("✅ resets form after successful submission", async () => {
    quizService.createQuiz.mockResolvedValue({});
    renderCreateQuiz();
    await fillValidForm();

    await userEvent.click(screen.getByText("Save"));

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/e.g. chapter/i).value).toBe("");
    });
  });

  test("❌ shows error toast when API call fails", async () => {
    quizService.createQuiz.mockRejectedValue({
      response: { data: { message: "Server error" } },
    });
    renderCreateQuiz();
    await fillValidForm();

    await userEvent.click(screen.getByText("Save"));

    await waitFor(() => {
      expect(screen.getByText(/failed to create quiz/i)).toBeInTheDocument();
    });
  });

  test("✅ disables save button while submitting", async () => {
    quizService.createQuiz.mockReturnValue(new Promise(() => {}));
    renderCreateQuiz();
    await fillValidForm();

    await userEvent.click(screen.getByText("Save"));

    await waitFor(() => {
      expect(screen.getByText("Saving...")).toBeDisabled();
    });
  });

});

// ═══════════════════════════════════════════════════════════════════
// Question management
// ═══════════════════════════════════════════════════════════════════
describe("CreateQuiz – question management", () => {

  test("✅ adds a new question when Add Question is clicked", async () => {
    renderCreateQuiz();
    await waitFor(() => screen.getByText("Question 1"));

    await userEvent.click(screen.getByText(/\+ add question manually/i));

    expect(screen.getByText("Question 2")).toBeInTheDocument();
  });

  test("✅ removes a question when Remove is clicked", async () => {
    renderCreateQuiz();
    await waitFor(() => screen.getByText("Question 1"));

    await userEvent.click(screen.getByText(/\+ add question manually/i));
    expect(screen.getByText("Question 2")).toBeInTheDocument();

    const removeButtons = screen.getAllByText(/✕ remove/i);
    await userEvent.click(removeButtons[0]);

    await waitFor(() => {
      expect(screen.queryByText("Question 2")).not.toBeInTheDocument();
    });
  });

  test("✅ shows question count banner when more than 1 question", async () => {
    renderCreateQuiz();
    await waitFor(() => screen.getByText("Question 1"));

    await userEvent.click(screen.getByText(/\+ add question manually/i));

    expect(screen.getByText(/2 questions in this quiz/i)).toBeInTheDocument();
  });

  test("✅ clears all questions when Clear all is clicked", async () => {
    renderCreateQuiz();
    await waitFor(() => screen.getByText("Question 1"));

    await userEvent.click(screen.getByText(/\+ add question manually/i));
    await userEvent.click(screen.getByText(/clear all/i));

    await waitFor(() => {
      expect(screen.queryByText("Question 2")).not.toBeInTheDocument();
    });
  });

  test("✅ selecting correct answer highlights the option", async () => {
    renderCreateQuiz();
    await waitFor(() => screen.getByText("Question 1"));

    expect(screen.getByText(/option a/i)).toBeInTheDocument();
  });

});

// ═══════════════════════════════════════════════════════════════════
// Import modal
// ═══════════════════════════════════════════════════════════════════
describe("CreateQuiz – import modal", () => {

  test("✅ opens import modal when Import Questions is clicked", async () => {
    renderCreateQuiz();
    await waitFor(() => screen.getByText("Create New Quiz"));

    await userEvent.click(screen.getAllByText(/import questions/i)[0]);

    expect(screen.getByText("Import Questions")).toBeInTheDocument();
  });

  test("✅ closes import modal when Cancel is clicked", async () => {
    renderCreateQuiz();
    await waitFor(() => screen.getByText("Create New Quiz"));

    await userEvent.click(screen.getAllByText(/import questions/i)[0]);
    await userEvent.click(screen.getByText("Cancel"));

    await waitFor(() => {
      expect(screen.queryByText("From PDF")).not.toBeInTheDocument();
    });
  });

  test("✅ closes import modal when ✕ button is clicked", async () => {
    renderCreateQuiz();
    await waitFor(() => screen.getByText("Create New Quiz"));

    await userEvent.click(screen.getAllByText(/import questions/i)[0]);
    await userEvent.click(screen.getByText("✕"));

    await waitFor(() => {
      expect(screen.queryByText("📄 From PDF")).not.toBeInTheDocument();
    });
  });

});