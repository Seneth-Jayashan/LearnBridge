/**
 * src/tests/unit/TakeQuiz.test.jsx
 *
 * Tests for the student quiz-taking experience (TakeQuiz.jsx)
 * Covers: loading, question display, answer selection, flagging,
 *         navigation, timer, submission, results screen
 */

import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";

// ── Service mock ──────────────────────────────────────────────────────
jest.mock("../../services/QuizService.jsx", () => ({
  __esModule: true,
  default: {
    getQuizById: jest.fn(),
    submitQuiz:  jest.fn(),
  },
}));

import quizService from "../../services/QuizService.jsx";
import TakeQuiz    from "../../pages/TakeQuiz.jsx";

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

// ── Fake data ─────────────────────────────────────────────────────────
const fakeQuiz = {
  _id: "quiz1",
  title: "Algebra Quiz",
  timeLimit: 1, // 1 minute = 60s
  questions: [
    {
      questionText: "What is 2 + 2?",
      options: ["1", "2", "3", "4"],
      correctAnswer: 3,
    },
    {
      questionText: "What is 3 × 3?",
      options: ["6", "7", "8", "9"],
      correctAnswer: 3,
    },
  ],
};

const fakeResult = {
  score:          1,
  totalQuestions: 2,
  correctAnswers: [3, 3],
};

const renderTakeQuiz = (quizId = "quiz1") =>
  render(
    <MemoryRouter initialEntries={[`/student/quiz/${quizId}`]}>
      <Routes>
        <Route path="/student/quiz/:id" element={<TakeQuiz />} />
      </Routes>
    </MemoryRouter>
  );

// ── userEvent helper ──────────────────────────────────────────────────
// IMPORTANT: when fake timers are active, userEvent must be configured
// to use fake timers too — otherwise pointer-event delays hang forever.
const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
});

afterEach(() => {
  // Guard: only flush pending timers if fake timers are still active.
  // The timer auto-submit test switches to real timers mid-test, so
  // calling runOnlyPendingTimers() after that would throw a warning.
  try { jest.runOnlyPendingTimers(); } catch (_) {}
  jest.useRealTimers();
});

// ═══════════════════════════════════════════════════════════════════
// Loading & error
// ═══════════════════════════════════════════════════════════════════
describe("TakeQuiz – loading & error", () => {

  test("✅ shows loading screen while fetching quiz", () => {
    quizService.getQuizById.mockReturnValue(new Promise(() => {}));
    renderTakeQuiz();

    expect(screen.getByText(/preparing your quiz/i)).toBeInTheDocument();
  });

  test("❌ shows error screen when quiz fetch fails", async () => {
    quizService.getQuizById.mockRejectedValue(new Error("Not found"));
    renderTakeQuiz();

    await waitFor(() => {
      expect(screen.getByText(/failed to load quiz/i)).toBeInTheDocument();
    });
  });

  test("✅ error screen has a Go back button", async () => {
    quizService.getQuizById.mockRejectedValue(new Error("Not found"));
    renderTakeQuiz();

    await waitFor(() => screen.getByText("Go back"));
    await user.click(screen.getByText("Go back"));

    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

});

// ═══════════════════════════════════════════════════════════════════
// Quiz display
// ═══════════════════════════════════════════════════════════════════
describe("TakeQuiz – quiz display", () => {

  test("✅ renders quiz title in header", async () => {
    quizService.getQuizById.mockResolvedValue({ quiz: fakeQuiz });
    renderTakeQuiz();

    await waitFor(() => {
      expect(screen.getByText("Algebra Quiz")).toBeInTheDocument();
    });
  });

  test("✅ renders first question by default", async () => {
    quizService.getQuizById.mockResolvedValue({ quiz: fakeQuiz });
    renderTakeQuiz();

    await waitFor(() => {
      expect(screen.getByText("What is 2 + 2?")).toBeInTheDocument();
    });
  });

  test("✅ renders all answer options for first question", async () => {
    quizService.getQuizById.mockResolvedValue({ quiz: fakeQuiz });
    renderTakeQuiz();

    await waitFor(() => screen.getByText("What is 2 + 2?"));

    // The UI renders question-nav buttons (1, 2) AND answer option spans (1, 2, 3, 4).
    // Use getAllByText and assert at least one match lives inside an answer button.
    const answerButtons = screen
      .getAllByRole("button")
      .filter((btn) => btn.querySelector("span.text-sm"));

    const answerTexts = answerButtons.map((btn) =>
      btn.querySelector("span.text-sm")?.textContent?.trim()
    );

    expect(answerTexts).toContain("1");
    expect(answerTexts).toContain("2");
    expect(answerTexts).toContain("3");
    expect(answerTexts).toContain("4");
  });

  test("✅ shows question count e.g. 1 of 2", async () => {
    quizService.getQuizById.mockResolvedValue({ quiz: fakeQuiz });
    renderTakeQuiz();

    await waitFor(() => {
      expect(screen.getByText(/question 1 of 2/i)).toBeInTheDocument();
    });
  });

  test("✅ shows timer", async () => {
    quizService.getQuizById.mockResolvedValue({ quiz: fakeQuiz });
    renderTakeQuiz();

    await waitFor(() => {
      expect(screen.getByText(/01:00/)).toBeInTheDocument();
    });
  });

});

// ═══════════════════════════════════════════════════════════════════
// Answer selection & navigation
// ═══════════════════════════════════════════════════════════════════
describe("TakeQuiz – answer selection & navigation", () => {

  test("✅ selects an answer when option is clicked", async () => {
    quizService.getQuizById.mockResolvedValue({ quiz: fakeQuiz });
    renderTakeQuiz();

    await waitFor(() => screen.getByText("What is 2 + 2?"));

    // Click the answer button whose visible text span contains "4"
    const answerButtons = screen
      .getAllByRole("button")
      .filter((btn) => btn.querySelector("span.text-sm")?.textContent?.trim() === "4");

    expect(answerButtons.length).toBeGreaterThanOrEqual(1);
    await user.click(answerButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/1\/2 answered/i)).toBeInTheDocument();
    });
  });

  test("✅ navigates to next question", async () => {
    quizService.getQuizById.mockResolvedValue({ quiz: fakeQuiz });
    renderTakeQuiz();

    await waitFor(() => screen.getByText("What is 2 + 2?"));
    await user.click(screen.getByText(/next question/i));

    await waitFor(() => {
      expect(screen.getByText("What is 3 × 3?")).toBeInTheDocument();
    });
  });

  test("✅ navigates back to previous question", async () => {
    quizService.getQuizById.mockResolvedValue({ quiz: fakeQuiz });
    renderTakeQuiz();

    await waitFor(() => screen.getByText("What is 2 + 2?"));

    // Go to question 2
    await user.click(screen.getByText(/next question/i));
    await waitFor(() => screen.getByText("What is 3 × 3?"));

    // Go back
    await user.click(screen.getByText(/← previous/i));
    await waitFor(() => {
      expect(screen.getByText("What is 2 + 2?")).toBeInTheDocument();
    });
  });

  test("✅ Previous button is disabled on first question", async () => {
    quizService.getQuizById.mockResolvedValue({ quiz: fakeQuiz });
    renderTakeQuiz();

    await waitFor(() => screen.getByText("What is 2 + 2?"));

    expect(screen.getByText(/← previous/i)).toBeDisabled();
  });

});

// ═══════════════════════════════════════════════════════════════════
// Flagging
// ═══════════════════════════════════════════════════════════════════
describe("TakeQuiz – flagging", () => {

  test("✅ flags a question when Flag button is clicked", async () => {
    quizService.getQuizById.mockResolvedValue({ quiz: fakeQuiz });
    renderTakeQuiz();

    // Target the flag toggle button specifically by its title attribute
    // to avoid colliding with the sidebar legend item that also says "Flagged"
    await waitFor(() => screen.getByTitle("Flag for review"));
    await user.click(screen.getByTitle("Flag for review"));

    // After flagging, the button switches to title="Remove flag"
    expect(screen.getByTitle("Remove flag")).toBeInTheDocument();
  });

  test("✅ unflagging removes flag label", async () => {
    quizService.getQuizById.mockResolvedValue({ quiz: fakeQuiz });
    renderTakeQuiz();

    await waitFor(() => screen.getByTitle("Flag for review"));
    await user.click(screen.getByTitle("Flag for review"));   // flag
    await user.click(screen.getByTitle("Remove flag"));       // unflag

    // Button should revert to the unflagged title
    expect(screen.getByTitle("Flag for review")).toBeInTheDocument();
    expect(screen.queryByTitle("Remove flag")).not.toBeInTheDocument();
  });

  test("✅ shows flagged warning banner when questions are flagged", async () => {
    quizService.getQuizById.mockResolvedValue({ quiz: fakeQuiz });
    renderTakeQuiz();

    await waitFor(() => screen.getByTitle("Flag for review"));
    await user.click(screen.getByTitle("Flag for review"));

    expect(screen.getByText(/1 flagged question/i)).toBeInTheDocument();
  });

});

// ═══════════════════════════════════════════════════════════════════
// Submission
// ═══════════════════════════════════════════════════════════════════
describe("TakeQuiz – submission", () => {

  test("✅ shows Submit button on last question", async () => {
    quizService.getQuizById.mockResolvedValue({ quiz: fakeQuiz });
    renderTakeQuiz();

    await waitFor(() => screen.getByText("What is 2 + 2?"));
    await user.click(screen.getByText(/next question/i));

    await waitFor(() => {
      expect(screen.getByText(/submit quiz/i)).toBeInTheDocument();
    });
  });

  test("✅ submits quiz and shows results screen", async () => {
    quizService.getQuizById.mockResolvedValue({ quiz: fakeQuiz });
    quizService.submitQuiz.mockResolvedValue(fakeResult);
    renderTakeQuiz();

    await waitFor(() => screen.getByText("What is 2 + 2?"));

    await user.click(screen.getByText(/next question/i));
    await waitFor(() => screen.getByText(/submit quiz/i));
    await user.click(screen.getAllByText(/submit quiz/i)[0]);

    await waitFor(() => {
      expect(screen.getByText(/quiz completed/i)).toBeInTheDocument();
      expect(screen.getByText(/quiz results/i)).toBeInTheDocument();
    });
  });

  test("✅ results screen shows correct score", async () => {
    quizService.getQuizById.mockResolvedValue({ quiz: fakeQuiz });
    quizService.submitQuiz.mockResolvedValue(fakeResult);
    renderTakeQuiz();

    await waitFor(() => screen.getByText("What is 2 + 2?"));
    await user.click(screen.getByText(/next question/i));
    await waitFor(() => screen.getByText(/submit quiz/i));
    await user.click(screen.getAllByText(/submit quiz/i)[0]);

    await waitFor(() => {
      expect(screen.getByText("1/2")).toBeInTheDocument();
    });
  });

  test("❌ shows submission error when API fails", async () => {
    quizService.getQuizById.mockResolvedValue({ quiz: fakeQuiz });
    quizService.submitQuiz.mockRejectedValue(new Error("Submit failed"));
    renderTakeQuiz();

    await waitFor(() => screen.getByText("What is 2 + 2?"));
    await user.click(screen.getByText(/next question/i));
    await waitFor(() => screen.getByText(/submit quiz/i));
    await user.click(screen.getAllByText(/submit quiz/i)[0]);

    await waitFor(() => {
      expect(screen.getByText(/submission failed/i)).toBeInTheDocument();
    });
  });

  test("✅ timer auto-submits when time runs out", async () => {
    // Use a quiz with timeLimit: 0 so the component initializes timeLeft
    // to 0 seconds — the interval fires on the very first tick and
    // immediately triggers auto-submit without needing to count down.
    const instantQuiz = { ...fakeQuiz, timeLimit: 0 };
    quizService.getQuizById.mockResolvedValue({ quiz: instantQuiz });
    quizService.submitQuiz.mockResolvedValue(fakeResult);

    // Flush the fetch promise so the component mounts with timeLeft = 0
    await act(async () => {
      renderTakeQuiz();
    });

    // Advance one interval tick (1000ms) — this fires the setInterval
    // callback which sees timeLeft <= 0 and calls handleSubmit()
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    // submitQuiz is async so give microtasks a chance to settle
    await act(async () => {});

    expect(quizService.submitQuiz).toHaveBeenCalled();
  });

});

// ═══════════════════════════════════════════════════════════════════
// Results screen navigation
// ═══════════════════════════════════════════════════════════════════
describe("TakeQuiz – results screen navigation", () => {

  const submitAndSeeResults = async () => {
    quizService.getQuizById.mockResolvedValue({ quiz: fakeQuiz });
    quizService.submitQuiz.mockResolvedValue(fakeResult);
    renderTakeQuiz();

    await waitFor(() => screen.getByText("What is 2 + 2?"));
    await user.click(screen.getByText(/next question/i));
    await waitFor(() => screen.getByText(/submit quiz/i));
    await user.click(screen.getAllByText(/submit quiz/i)[0]);
    await waitFor(() => screen.getByText(/quiz completed/i));
  };

  test("✅ Back to Module button calls navigate(-1)", async () => {
    await submitAndSeeResults();

    await user.click(screen.getAllByText(/back to module/i)[0]);
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  test("✅ View All My Results navigates to results page", async () => {
    await submitAndSeeResults();

    await user.click(screen.getByText(/view all my results/i));
    expect(mockNavigate).toHaveBeenCalledWith("/student/results");
  });

});