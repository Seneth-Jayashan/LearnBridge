// Import testing utilities
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Router wrapper
import { MemoryRouter } from "react-router-dom";

// Vitest functions
import { vi, describe, it, expect, beforeEach } from "vitest";

// Import components under test
import AddModules from "../../../pages/admin/Modules/AddModules";
import EditModules from "../../../pages/admin/Modules/EditModules";
import ModulesManage from "../../../pages/admin/Modules/ModulesManage";

// Import services (will be mocked)
import moduleService from "../../../services/ModuleService";
import levelService from "../../../services/LevelService";
import gradeService from "../../../services/GradeService";

// Mock navigation
const mockNavigate = vi.fn();

/**
 * Mock ModuleService (CRUD operations)
 */
vi.mock("../../../services/ModuleService", () => ({
  default: {
    createModule: vi.fn(),
    getModuleById: vi.fn(),
    updateModule: vi.fn(),
    getAllModules: vi.fn(),
    deleteModule: vi.fn(),
  },
}));

/**
 * Mock LevelService (used for dropdown population)
 */
vi.mock("../../../services/LevelService", () => ({
  default: { getAllLevels: vi.fn() },
}));

/**
 * Mock GradeService (used for dependent dropdown)
 */
vi.mock("../../../services/GradeService", () => ({
  default: { getAllGrades: vi.fn() },
}));

/**
 * Mock SweetAlert (confirmation dialogs)
 */
vi.mock("sweetalert2-react-content", () => ({
  default: () => ({ fire: vi.fn().mockResolvedValue({ isConfirmed: false }) }),
}));

/**
 * Mock React Router
 * - useNavigate → capture navigation
 * - useParams → simulate module ID
 */
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: "mod-1" }),
  };
});

/**
 * Helper render function with router context
 */
const renderPage = (node) => render(<MemoryRouter>{node}</MemoryRouter>);

/**
 * Mock data for dropdowns
 */
const levels = [{ _id: "lv1", name: "Primary Education" }];
const grades = [{ _id: "g1", name: "3", level: { _id: "lv1" } }];

/**
 * Test Suite: Modules Pages
 */
describe("Modules pages", () => {

  /**
   * Setup before each test
   * - Clear mocks
   * - Provide default dropdown data
   */
  beforeEach(() => {
    vi.clearAllMocks();
    levelService.getAllLevels.mockResolvedValue(levels);
    gradeService.getAllGrades.mockResolvedValue(grades);
  });

  /**
   * Test: AddModules
   * - Negative case (validation failure)
   * - Positive case (successful submission)
   */
  it("AddModules negative and positive submit", async () => {
    // Mock API response
    moduleService.createModule.mockResolvedValue({ _id: "m1" });

    renderPage(<AddModules />);

    // Ensure page loads
    expect(await screen.findByText(/add new module/i)).toBeInTheDocument();

    // ❌ Negative test: submit without filling form
    await userEvent.click(screen.getByRole("button", { name: /create module/i }));
    expect(await screen.findByText(/level is required/i)).toBeInTheDocument();

    // ✅ Fill form properly
    await userEvent.selectOptions(screen.getByLabelText(/^level/i), "lv1");
    await userEvent.selectOptions(screen.getByLabelText(/^grade/i), "g1");
    await userEvent.type(screen.getByLabelText(/module name/i), "Algebra Basics");

    // Submit again
    await userEvent.click(screen.getByRole("button", { name: /create module/i }));

    // Verify API call
    await waitFor(() => expect(moduleService.createModule).toHaveBeenCalled());
  });

  /**
   * Test: EditModules
   * - Load existing module
   * - Submit update
   */
  it("EditModules loads existing module", async () => {
    // Mock existing module fetch
    moduleService.getModuleById.mockResolvedValue({
      _id: "mod-1",
      level: "lv1",
      grade: "g1",
      name: "Geometry",
    });

    // Mock update response
    moduleService.updateModule.mockResolvedValue({});

    renderPage(<EditModules />);

    // Ensure data is pre-filled
    expect(await screen.findByDisplayValue("Geometry")).toBeInTheDocument();

    // Submit without changing (valid case)
    await userEvent.click(screen.getByRole("button", { name: /save changes/i }));

    // Verify update call
    await waitFor(() => expect(moduleService.updateModule).toHaveBeenCalled());
  });

  /**
   * Test: ModulesManage
   * - Display modules list
   * - Verify UI elements
   */
  it("ModulesManage UI shows records", async () => {
    // Mock modules list
    moduleService.getAllModules.mockResolvedValue([
      {
        _id: "m1",
        name: "Physics",
        level: { _id: "lv1", name: "Primary" },
        grade: { _id: "g1", name: "Grade 7" },
      },
    ]);

    // Mock grades (used for filtering/display)
    gradeService.getAllGrades.mockResolvedValue([
      { _id: "g1", name: "Grade 7" },
    ]);

    renderPage(<ModulesManage />);

    // Ensure module appears
    expect(await screen.findByText("Physics")).toBeInTheDocument();

    // Ensure "Add Module" button exists
    expect(screen.getByRole("button", { name: /add module/i })).toBeInTheDocument();
  });
});