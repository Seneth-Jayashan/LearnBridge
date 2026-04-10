// Import testing utilities
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Router wrapper for testing navigation
import { MemoryRouter } from "react-router-dom";

// Vitest core functions
import { vi, describe, it, expect, beforeEach } from "vitest";

// Import components under test
import AddLevels from "../../../pages/admin/Levels/AddLevels";
import EditLevels from "../../../pages/admin/Levels/EditLevels";
import LevelManage from "../../../pages/admin/Levels/LevelManage";

// Import service (will be mocked)
import levelService from "../../../services/LevelService";

// Mock navigation function
const mockNavigate = vi.fn();

/**
 * Mock LevelService methods
 * Prevents real API calls and allows full control over responses
 */
vi.mock("../../../services/LevelService", () => ({
  default: {
    createLevel: vi.fn(),
    getLevelById: vi.fn(),
    updateLevel: vi.fn(),
    getAllLevels: vi.fn(),
    deleteLevel: vi.fn(),
    syncDefaultLevels: vi.fn(),
  },
}));

/**
 * Mock authentication context
 * Always treat user as Super Admin
 */
vi.mock("../../../contexts/AuthContext", () => ({
  useAuth: () => ({ isSuperAdmin: true }),
}));

/**
 * Mock React Router hooks
 * - useNavigate → track navigation calls
 * - useParams → simulate route parameter (level id)
 */
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: "level-1" }),
  };
});

/**
 * Helper function to wrap components with router context
 */
const renderPage = (node) => render(<MemoryRouter>{node}</MemoryRouter>);

/**
 * Test Suite: Levels Pages
 */
describe("Levels pages", () => {

  /**
   * Runs before each test
   * - Clears all mocks
   * - Mocks browser confirm dialog (used in delete/sync actions)
   */
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, "confirm").mockReturnValue(true);
  });

  /**
   * Test: AddLevels - Successful form submission
   */
  it("AddLevels positive submit", async () => {
    // Mock API response
    levelService.createLevel.mockResolvedValue({ _id: "1" });

    renderPage(<AddLevels />);

    // Fill input field
    await userEvent.type(screen.getByLabelText(/level name/i), "Primary");

    // Submit form
    await userEvent.click(screen.getByRole("button", { name: /create level/i }));

    // Verify API call
    await waitFor(() => expect(levelService.createLevel).toHaveBeenCalled());

    // Verify navigation after success
    expect(mockNavigate).toHaveBeenCalledWith("/admin/levels/manage");
  });

  /**
   * Test: AddLevels - Validation failure (empty input)
   */
  it("AddLevels negative required field", async () => {
    renderPage(<AddLevels />);

    // Submit without entering data
    await userEvent.click(screen.getByRole("button", { name: /create level/i }));

    // Expect validation message
    expect(await screen.findByText(/level name is required/i)).toBeInTheDocument();

    // Ensure API is NOT called
    expect(levelService.createLevel).not.toHaveBeenCalled();
  });

  /**
   * Test: EditLevels - Load existing level and update
   */
  it("EditLevels load and update", async () => {
    // Mock fetching existing level
    levelService.getLevelById.mockResolvedValue({
      _id: "level-1",
      name: "Primary",
      description: "desc",
    });

    // Mock update response
    levelService.updateLevel.mockResolvedValue({});

    renderPage(<EditLevels />);

    // Wait for data to populate input
    expect(await screen.findByDisplayValue("Primary")).toBeInTheDocument();

    // Submit without changing (still valid case)
    await userEvent.click(screen.getByRole("button", { name: /save changes/i }));

    // Verify update API call
    await waitFor(() => expect(levelService.updateLevel).toHaveBeenCalled());
  });

  /**
   * Test: LevelManage - List rendering and UI elements
   */
  it("LevelManage UI + list render", async () => {
    // Mock level list
    levelService.getAllLevels.mockResolvedValue([
      { _id: "l1", name: "Primary", description: "d" },
    ]);

    renderPage(<LevelManage />);

    // Verify level is displayed
    expect(await screen.findByText("Primary")).toBeInTheDocument();

    // Verify important UI actions exist
    expect(screen.getByRole("button", { name: /add level/i })).toBeInTheDocument();
  });
});