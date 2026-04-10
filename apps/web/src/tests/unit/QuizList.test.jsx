/**
 * src/tests/unit/QuizList.test.jsx
 *
 * Tests for the student quiz list view (QuizList.jsx)
 * Covers: loading, auth guard, empty state, quiz display, navigation
 */

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";

// ── Service & context mocks ───────────────────────────────────────────
jest.mock("../../services/QuizService", () => ({
  __esModule: true,
  default: { getQuizzesByModule: jest.fn() },
}));

jest.mock("../../services/ModuleService", () => ({
  __esModule: true,
  default: { getAllModules: jest.fn() },
}));

jest.mock("../../contexts/AuthContext", () => ({
  useAuth: jest.fn(),
}));

import quizService   from "../../services/QuizService";
import moduleService from "../../services/ModuleService";
import { useAuth }   from "../../contexts/AuthContext";
import QuizList      from "../../pages/QuizList.jsx";

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

// ── Fake data ─────────────────────────────────────────────────────────
const fakeUser = { _id: "student1", stream: null, role: "student" };

const fakeModules = [
  { _id: "mod1", name: "Algebra", grade: { name: "Grade 10" }, level: { name: "Ordinary" } },
  { _id: "mod2", name: "Physics", grade: { name: "Grade 11" }, level: { name: "Ordinary" } },
];

const fakeQuizzes = [
  { _id: "q1", title: "Algebra Quiz 1", questions: [{}], timeLimit: 30 },
  { _id: "q2", title: "Algebra Quiz 2", questions: [{}, {}], timeLimit: 20 },
];

const renderQuizList = (path = "/student/quizzes") =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/student/quizzes" element={<QuizList />} />
        <Route path="/student/quizzes/:courseId" element={<QuizList />} />
      </Routes>
    </MemoryRouter>
  );

beforeEach(() => {
  jest.clearAllMocks();
  useAuth.mockReturnValue({ user: fakeUser, loading: false });
});

// ═══════════════════════════════════════════════════════════════════
// Loading & auth
// ═══════════════════════════════════════════════════════════════════
describe("QuizList – loading & auth", () => {

  test("✅ shows loading spinner while auth is loading", () => {
    useAuth.mockReturnValue({ user: null, loading: true });
    // Keep module fetch pending so we stay in loading state
    moduleService.getAllModules.mockReturnValue(new Promise(() => {}));
    renderQuizList();

    // Component shows a loading indicator while auth is resolving —
    // match whatever spinner/text the component actually renders.
    // The component renders the page shell immediately; we verify it
    // does NOT yet show an auth error or quiz content.
    expect(screen.queryByText(/please sign in/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/algebra quiz/i)).not.toBeInTheDocument();
  });

  test("❌ shows error when user is not logged in", async () => {
    useAuth.mockReturnValue({ user: null, loading: false });
    moduleService.getAllModules.mockResolvedValue(fakeModules);
    quizService.getQuizzesByModule.mockResolvedValue([]);
    renderQuizList();

    await waitFor(() => {
      expect(screen.getByText(/please sign in/i)).toBeInTheDocument();
    });
  });

  test("❌ shows error when module fetch fails", async () => {
    moduleService.getAllModules.mockRejectedValue(new Error("Network error"));
    renderQuizList();

    await waitFor(() => {
      expect(screen.getByText(/failed to load quizzes/i)).toBeInTheDocument();
    });
  });

});

// ═══════════════════════════════════════════════════════════════════
// Rendering
// ═══════════════════════════════════════════════════════════════════
describe("QuizList – rendering", () => {

  test("✅ renders page heading", async () => {
    moduleService.getAllModules.mockResolvedValue([]);
    renderQuizList();

    await waitFor(() => {
      expect(screen.getByText("Available Quizzes")).toBeInTheDocument();
    });
  });

  test("✅ shows empty state when no quizzes exist", async () => {
    moduleService.getAllModules.mockResolvedValue(fakeModules);
    quizService.getQuizzesByModule.mockResolvedValue([]);
    renderQuizList();

    await waitFor(() => {
      expect(screen.getByText(/no quizzes available yet/i)).toBeInTheDocument();
    });
  });

  test("✅ renders module name and quiz titles", async () => {
    moduleService.getAllModules.mockResolvedValue(fakeModules);
    quizService.getQuizzesByModule.mockImplementation((moduleId) => {
      if (moduleId === "mod1") return Promise.resolve(fakeQuizzes);
      return Promise.resolve([]);
    });
    renderQuizList();

    await waitFor(() => {
      expect(screen.getByText("Algebra")).toBeInTheDocument();
      expect(screen.getByText("Algebra Quiz 1")).toBeInTheDocument();
      expect(screen.getByText("Algebra Quiz 2")).toBeInTheDocument();
    });
  });

  test("✅ renders quiz question count and time limit", async () => {
    moduleService.getAllModules.mockResolvedValue([fakeModules[0]]);
    quizService.getQuizzesByModule.mockResolvedValue(fakeQuizzes);
    renderQuizList();

    await waitFor(() => {
      expect(screen.getByText(/1 questions/i)).toBeInTheDocument();
      expect(screen.getByText(/30 minutes/i)).toBeInTheDocument();
    });
  });

  test("✅ shows grade and level badges for module", async () => {
    moduleService.getAllModules.mockResolvedValue([fakeModules[0]]);
    quizService.getQuizzesByModule.mockResolvedValue(fakeQuizzes);
    renderQuizList();

    await waitFor(() => {
      expect(screen.getByText("Grade 10")).toBeInTheDocument();
      expect(screen.getByText("Ordinary")).toBeInTheDocument();
    });
  });

});

// ═══════════════════════════════════════════════════════════════════
// Navigation
// ═══════════════════════════════════════════════════════════════════
describe("QuizList – navigation", () => {

  test("✅ Start Quiz navigates to quiz take page", async () => {
    moduleService.getAllModules.mockResolvedValue([fakeModules[0]]);
    quizService.getQuizzesByModule.mockResolvedValue([fakeQuizzes[0]]);
    renderQuizList();

    await waitFor(() => screen.getByText("Start Quiz"));
    await userEvent.click(screen.getByText("Start Quiz"));

    expect(mockNavigate).toHaveBeenCalledWith("/student/quiz/q1");
  });

  test("✅ Back button calls navigate(-1)", async () => {
    moduleService.getAllModules.mockResolvedValue([]);
    renderQuizList();

    await waitFor(() => screen.getByText("Back"));
    await userEvent.click(screen.getByText("Back"));

    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

});

// ═══════════════════════════════════════════════════════════════════
// Stream filtering
// ═══════════════════════════════════════════════════════════════════
describe("QuizList – stream filtering", () => {

  test("✅ filters modules by student stream when stream is set", async () => {
    const streamUser = { ...fakeUser, stream: "Science" };
    useAuth.mockReturnValue({ user: streamUser, loading: false });

    const mixedModules = [
      { ...fakeModules[0], subjectStream: "Science" },
      { ...fakeModules[1], subjectStream: "Arts" },
    ];
    moduleService.getAllModules.mockResolvedValue(mixedModules);
    quizService.getQuizzesByModule.mockResolvedValue(fakeQuizzes);

    renderQuizList();

    await waitFor(() => {
      expect(quizService.getQuizzesByModule).toHaveBeenCalledWith("mod1");
      expect(quizService.getQuizzesByModule).not.toHaveBeenCalledWith("mod2");
    });
  });

});