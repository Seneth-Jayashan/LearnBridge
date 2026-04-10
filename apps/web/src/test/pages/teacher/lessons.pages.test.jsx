// Import testing utilities
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Router wrapper
import { MemoryRouter } from "react-router-dom";

// Vitest functions
import { vi, describe, it, expect, beforeEach } from "vitest";

// Import components under test
import LessonsAdd from "../../../pages/teacher/lessons/LessonsAdd";
import LessonsManage from "../../../pages/teacher/lessons/LessonsManage";

// Import services (will be mocked)
import lessonService from "../../../services/LessonService";
import moduleService from "../../../services/ModuleService";

// Mock navigation
const mockNavigate = vi.fn();

/**
 * Mock LessonService
 * Handles lesson CRUD + material download
 */
vi.mock("../../../services/LessonService", () => ({
  default: {
    createLesson: vi.fn(),
    getAllLessons: vi.fn(),
    deleteLesson: vi.fn(),
    getMaterialDownloadUrl: vi.fn(),
  },
}));

/**
 * Mock ModuleService
 * Used for selecting module when creating lesson
 */
vi.mock("../../../services/ModuleService", () => ({
  default: {
    getAllModules: vi.fn(),
  },
}));

/**
 * Mock SweetAlert (confirmation dialogs)
 */
vi.mock("sweetalert2-react-content", () => ({
  default: () => ({ fire: vi.fn().mockResolvedValue({ isConfirmed: false }) }),
}));

/**
 * Mock React Router
 * - useNavigate → track navigation after actions
 */
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

/**
 * Helper function to render with router context
 */
const renderPage = (node) => render(<MemoryRouter>{node}</MemoryRouter>);

/**
 * Test Suite: Teacher Lessons Pages
 */
describe("Teacher lessons pages", () => {

  /**
   * Reset mocks before each test
   */
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Test: LessonsAdd
   * - Negative case: validation fails when required fields are missing
   */
  it("LessonsAdd negative validation", async () => {
    // Mock modules list (empty)
    moduleService.getAllModules.mockResolvedValue([]);

    renderPage(<LessonsAdd />);

    // Ensure page loads
    expect(await screen.findByText(/add new lesson/i)).toBeInTheDocument();

    // Submit without filling form
    await userEvent.click(screen.getByRole("button", { name: /create lesson/i }));

    // Expect validation error
    expect(await screen.findByText(/lesson title is required/i)).toBeInTheDocument();
  });

  /**
   * Test: LessonsAdd
   * - Positive case: create lesson with file upload
   */
  it("LessonsAdd positive submit", async () => {
    // Mock module list
    moduleService.getAllModules.mockResolvedValue([
      { _id: "m1", name: "Biology", grade: { name: "Grade 9" } },
    ]);

    // Mock successful lesson creation
    lessonService.createLesson.mockResolvedValue({ _id: "l1" });

    renderPage(<LessonsAdd />);

    // Select module via search
    await userEvent.type(
      await screen.findByPlaceholderText(/search for a module/i),
      "Biology"
    );
    await userEvent.click(await screen.findByText("Biology"));

    // Enter lesson title
    await userEvent.type(
      screen.getByLabelText(/lesson title/i),
      "Cell Theory"
    );

    // Handle file upload
    const fileInput = document.querySelector(
      'input[name="materialUrl"][type="file"]'
    );
    expect(fileInput).toBeTruthy();

    const file = new File(
      ["lesson material"],
      "material.pdf",
      { type: "application/pdf" }
    );

    await userEvent.upload(fileInput, file);

    // Submit form
    await userEvent.click(screen.getByRole("button", { name: /create lesson/i }));

    // Verify API call
    await waitFor(() => expect(lessonService.createLesson).toHaveBeenCalled());

    // Verify navigation after success
    expect(mockNavigate).toHaveBeenCalledWith("/teacher/lessons/manage");
  });

  /**
   * Test: LessonsManage
   * - Render grouped lessons and UI elements
   */
  it("LessonsManage UI render with grouped lesson", async () => {
    // Mock lessons grouped by module
    lessonService.getAllLessons.mockResolvedValue([
      {
        _id: "l1",
        title: "Intro",
        module: {
          _id: "m1",
          name: "Math",
          grade: { _id: "g1", name: "Grade 8" },
        },
      },
    ]);

    renderPage(<LessonsManage />);

    // Ensure page heading renders
    expect(await screen.findByText(/manage lessons/i)).toBeInTheDocument();

    // Verify "Add Lesson" button
    expect(screen.getByRole("button", { name: /add lesson/i })).toBeInTheDocument();

    // Verify module grouping display
    expect(screen.getByText("Math")).toBeInTheDocument();
  });
});