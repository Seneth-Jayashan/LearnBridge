// Import testing utilities from React Testing Library
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// React Router wrapper for testing navigation
import { MemoryRouter } from "react-router-dom";

// Vitest testing functions
import { vi, describe, it, expect, beforeEach } from "vitest";

// Import components to test
import AddGrade from "../../../pages/admin/Grades/AddGrade";
import EditGrade from "../../../pages/admin/Grades/EditGrade";
import GradeManage from "../../../pages/admin/Grades/GradeManage";

// Import service layer (will be mocked)
import gradeService from "../../../services/GradeService";

// Mock navigate function
const mockNavigate = vi.fn();

/**
 * Mock GradeService methods
 * This prevents real API calls and allows control over responses
 */
vi.mock("../../../services/GradeService", () => ({
  default: {
    createGrade: vi.fn(),
    getGradeById: vi.fn(),
    updateGrade: vi.fn(),
    getAllGrades: vi.fn(),
    deleteGrade: vi.fn(),
    syncDefaultGrades: vi.fn(),
  },
}));

/**
 * Mock AuthContext
 * Always treat user as Super Admin for these tests
 */
vi.mock("../../../contexts/AuthContext", () => ({
  useAuth: () => ({ isSuperAdmin: true }),
}));

/**
 * Mock SweetAlert (confirmation dialogs)
 * Always return "not confirmed" by default
 */
vi.mock("sweetalert2-react-content", () => ({
  default: () => ({ fire: vi.fn().mockResolvedValue({ isConfirmed: false }) }),
}));

/**
 * Mock React Router hooks
 * - useNavigate → track navigation calls
 * - useParams → simulate route params
 */
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: "grade-1" }),
  };
});

/**
 * Helper function to render components with router context
 */
const renderPage = (node) => render(<MemoryRouter>{node}</MemoryRouter>);

/**
 * Test Suite: Grades Pages
 */
describe("Grades pages", () => {

  /**
   * Reset all mocks before each test
   */
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Test: AddGrade - Successful form submission
   */
  it("AddGrade UI + positive submit", async () => {
    // Mock API response
    gradeService.createGrade.mockResolvedValue({ _id: "1" });

    renderPage(<AddGrade />);

    // Check heading renders
    expect(screen.getByRole("heading", { name: /add new grade/i })).toBeInTheDocument();

    // Fill form input
    await userEvent.type(screen.getByLabelText(/grade name/i), "Grade 6");

    // Submit form
    await userEvent.click(screen.getByRole("button", { name: /create grade/i }));

    // Ensure API call was made
    await waitFor(() => expect(gradeService.createGrade).toHaveBeenCalled());

    // Ensure navigation after success
    expect(mockNavigate).toHaveBeenCalledWith("/admin/grades/manage");
  });

  /**
   * Test: AddGrade - Validation error when input is empty
   */
  it("AddGrade negative validation", async () => {
    renderPage(<AddGrade />);

    // Click submit without entering data
    await userEvent.click(screen.getByRole("button", { name: /create grade/i }));

    // Expect validation message
    expect(await screen.findByText(/grade name is required/i)).toBeInTheDocument();

    // Ensure API is NOT called
    expect(gradeService.createGrade).not.toHaveBeenCalled();
  });

  /**
   * Test: EditGrade - Load existing data and update
   */
  it("EditGrade loads + saves", async () => {
    // Mock fetching existing grade
    gradeService.getGradeById.mockResolvedValue({
      _id: "grade-1",
      name: "Grade 1",
      description: "desc",
    });

    // Mock update response
    gradeService.updateGrade.mockResolvedValue({});

    renderPage(<EditGrade />);

    // Wait until data is loaded into input
    expect(await screen.findByDisplayValue("Grade 1")).toBeInTheDocument();

    // Modify input value
    await userEvent.clear(screen.getByLabelText(/grade name/i));
    await userEvent.type(screen.getByLabelText(/grade name/i), "Grade 2");

    // Submit changes
    await userEvent.click(screen.getByRole("button", { name: /save changes/i }));

    // Ensure update API is called
    await waitFor(() => expect(gradeService.updateGrade).toHaveBeenCalled());

    // Ensure navigation after update
    expect(mockNavigate).toHaveBeenCalledWith("/admin/grades/manage");
  });

  /**
   * Test: GradeManage - Display grades and action buttons
   */
  it("GradeManage shows rows and actions", async () => {
    // Mock grade list
    gradeService.getAllGrades.mockResolvedValue([
      { _id: "g1", name: "Grade 1", description: "Primary" },
    ]);

    renderPage(<GradeManage />);

    // Check grade appears in table
    expect(await screen.findByText("Grade 1")).toBeInTheDocument();

    // Check important action buttons exist
    expect(screen.getByRole("button", { name: /add grade/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sync defaults/i })).toBeInTheDocument();
  });
});