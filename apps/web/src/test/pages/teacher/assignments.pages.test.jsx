// Import testing utilities
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Router wrapper
import { MemoryRouter } from "react-router-dom";

// Vitest functions
import { vi, describe, it, expect, beforeEach } from "vitest";

// Import components under test
import AssignmentsAdd from "../../../pages/teacher/assignments/AssignmentsAdd";
import AssignmentsManage from "../../../pages/teacher/assignments/AssignmentsManage";

// Import services (will be mocked)
import assignmentService from "../../../services/AssignmentService";
import moduleService from "../../../services/ModuleService";

// Mock navigation
const mockNavigate = vi.fn();

/**
 * Mock AssignmentService
 * Handles assignment CRUD + submissions
 */
vi.mock("../../../services/AssignmentService", () => ({
  default: {
    createAssignment: vi.fn(),
    getAllAssignments: vi.fn(),
    deleteAssignment: vi.fn(),
    getAssignmentSubmissions: vi.fn(),
    getSubmissionDownloadUrl: vi.fn(),
  },
}));

/**
 * Mock ModuleService
 * Used for module selection in assignment creation
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
 * - useNavigate → capture navigation calls
 */
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

/**
 * Helper render function with router context
 */
const renderPage = (node) => render(<MemoryRouter>{node}</MemoryRouter>);

/**
 * Test Suite: Teacher Assignments Pages
 */
describe("Teacher assignments pages", () => {

  /**
   * Reset mocks before each test
   */
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Test: AssignmentsAdd
   * - Negative case: validation fails when required fields are empty
   */
  it("AssignmentsAdd negative required validation", async () => {
    // Mock modules (empty list)
    moduleService.getAllModules.mockResolvedValue([]);

    renderPage(<AssignmentsAdd />);

    // Ensure page loads
    expect(await screen.findByText(/add new assignment/i)).toBeInTheDocument();

    // Submit without filling form
    await userEvent.click(screen.getByRole("button", { name: /create assignment/i }));

    // Expect validation error
    expect(await screen.findByText(/assignment title is required/i)).toBeInTheDocument();
  });

  /**
   * Test: AssignmentsAdd
   * - Positive case: create assignment successfully
   */
  it("AssignmentsAdd positive create", async () => {
    // Mock module list (for selection)
    moduleService.getAllModules.mockResolvedValue([
      { _id: "m1", name: "Algebra", grade: { name: "Grade 7" } },
    ]);

    // Mock successful creation
    assignmentService.createAssignment.mockResolvedValue({ _id: "a1" });

    renderPage(<AssignmentsAdd />);

    // Search and select module
    const search = await screen.findByPlaceholderText(/search for a module/i);
    await userEvent.type(search, "Algebra");
    await userEvent.click(await screen.findByText("Algebra"));

    // Fill assignment title
    await userEvent.type(
      screen.getByLabelText(/assignment title/i),
      "Homework 1"
    );

    // Submit form
    await userEvent.click(screen.getByRole("button", { name: /create assignment/i }));

    // Verify API call
    await waitFor(() => expect(assignmentService.createAssignment).toHaveBeenCalled());

    // Verify navigation after success
    expect(mockNavigate).toHaveBeenCalledWith("/teacher/assignments/manage");
  });

  /**
   * Test: AssignmentsManage
   * - Render assignment list and UI elements
   */
  it("AssignmentsManage UI list render", async () => {
    // Mock assignment list
    assignmentService.getAllAssignments.mockResolvedValue([
      {
        _id: "a1",
        title: "Essay",
        module: {
          name: "English",
          grade: { name: "Grade 8" },
        },
        dueDate: new Date().toISOString(),
      },
    ]);

    renderPage(<AssignmentsManage />);

    // Verify assignment is displayed
    expect(await screen.findByText("Essay")).toBeInTheDocument();

    // Verify "Add Assignment" button exists
    expect(screen.getByRole("button", { name: /add assignment/i })).toBeInTheDocument();
  });
});