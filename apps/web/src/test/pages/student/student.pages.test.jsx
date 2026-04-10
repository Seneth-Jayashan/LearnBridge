// Import testing utilities
import { render, screen, waitFor } from "@testing-library/react";

// Router wrapper
import { MemoryRouter } from "react-router-dom";

// Vitest functions
import { vi, describe, it, expect, beforeEach } from "vitest";

// Import components under test
import StudentAssignments from "../../../pages/student/StudentAssignments";
import StudentModules from "../../../pages/student/StudentModules";

// Import services (will be mocked)
import assignmentService from "../../../services/AssignmentService";
import moduleService from "../../../services/ModuleService";
import lessonService from "../../../services/LessonService";

/**
 * Mock AssignmentService
 * Handles fetching and submitting assignments
 */
vi.mock("../../../services/AssignmentService", () => ({
  default: {
    getAllAssignments: vi.fn(),
    getAssignmentById: vi.fn(),
    submitAssignment: vi.fn(),
  },
}));

/**
 * Mock ModuleService
 * Used to fetch modules for students
 */
vi.mock("../../../services/ModuleService", () => ({
  default: {
    getAllModules: vi.fn(),
  },
}));

/**
 * Mock LessonService
 * Used to fetch lessons under modules
 */
vi.mock("../../../services/LessonService", () => ({
  default: {
    getAllLessons: vi.fn(),
  },
}));

/**
 * Mock AuthContext
 * Simulates logged-in student with "science" stream
 */
vi.mock("../../../contexts/AuthContext", () => ({
  useAuth: () => ({ user: { stream: "science" } }),
}));

/**
 * Helper function to render components with router context
 */
const renderPage = (node) => render(<MemoryRouter>{node}</MemoryRouter>);

/**
 * Test Suite: Student Pages
 */
describe("Student pages", () => {

  /**
   * Reset mocks before each test
   */
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Test: StudentAssignments
   * - Empty state when no assignments exist
   */
  it("StudentAssignments UI and empty state", async () => {
    // Mock API returning empty list
    assignmentService.getAllAssignments.mockResolvedValue([]);

    renderPage(<StudentAssignments />);

    // Verify page heading
    expect(await screen.findByText(/my assignments/i)).toBeInTheDocument();

    // Verify empty state message
    expect(screen.getByText(/you're all caught up/i)).toBeInTheDocument();
  });

  /**
   * Test: StudentAssignments
   * - API failure scenario
   */
  it("StudentAssignments negative fetch error", async () => {
    // Mock API failure
    assignmentService.getAllAssignments.mockRejectedValue(new Error("fail"));

    renderPage(<StudentAssignments />);

    // Verify error message displayed
    expect(await screen.findByText(/failed to load assignments/i)).toBeInTheDocument();
  });

  /**
   * Test: StudentModules
   * - Load modules filtered by student stream
   * - Load lessons linked to modules
   */
  it("StudentModules loads modules and lessons", async () => {
    // Mock modules (filtered by "science" stream)
    moduleService.getAllModules.mockResolvedValue([
      {
        _id: "m1",
        name: "Physics",
        grade: { name: "Grade 12" },
        subjectStream: "science",
      },
    ]);

    // Mock lessons under module
    lessonService.getAllLessons.mockResolvedValue([
      {
        _id: "l1",
        title: "Motion",
        module: { _id: "m1" },
      },
    ]);

    renderPage(<StudentModules />);

    // Ensure modules API is called
    await waitFor(() => expect(moduleService.getAllModules).toHaveBeenCalled());

    // Verify module is displayed
    expect(await screen.findByText(/physics/i)).toBeInTheDocument();
  });
});