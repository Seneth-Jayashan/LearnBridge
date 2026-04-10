// Import testing utilities
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Router wrapper
import { MemoryRouter } from "react-router-dom";

// Vitest functions
import { vi, describe, it, expect, beforeEach } from "vitest";

// Import components under test
import KnowledgeBaseAdd from "../../../pages/teacher/knowledge-base/KnowledgeBaseAdd";
import KnowledgeBaseEdit from "../../../pages/teacher/knowledge-base/KnowledgeBaseEdit";
import KnowledgeBaseManage from "../../../pages/teacher/knowledge-base/KnowledgeBaseManage";

// Import service (will be mocked)
import knowledgeBaseService from "../../../services/KnowledgeBaseService";

// Mock navigation
const mockNavigate = vi.fn();

/**
 * Mock KnowledgeBaseService
 * Handles CRUD operations for knowledge base articles
 */
vi.mock("../../../services/KnowledgeBaseService", () => ({
  default: {
    createEntry: vi.fn(),
    getAllEntries: vi.fn(),
    updateEntry: vi.fn(),
    deleteEntry: vi.fn(),
    getAttachmentDownloadUrl: vi.fn(),
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
 * - useNavigate → track navigation
 * - useParams → simulate article ID
 */
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: "kb-1" }),
  };
});

/**
 * Helper function to render with router context
 */
const renderPage = (node) => render(<MemoryRouter>{node}</MemoryRouter>);

/**
 * Test Suite: Teacher Knowledge Base Pages
 */
describe("Teacher knowledge base pages", () => {

  /**
   * Reset mocks before each test
   */
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Test: KnowledgeBaseAdd
   * - Negative case: validation failure
   * - Positive case: successful article creation
   */
  it("KnowledgeBaseAdd negative and positive", async () => {
    // Mock API response
    knowledgeBaseService.createEntry.mockResolvedValue({ id: "kb-1" });

    renderPage(<KnowledgeBaseAdd />);

    // ❌ Submit without filling required fields
    await userEvent.click(screen.getByRole("button", { name: /save article/i }));

    // Expect validation error
    expect(await screen.findByText(/article title is required/i)).toBeInTheDocument();

    // ✅ Fill required fields
    await userEvent.type(screen.getByLabelText(/article title/i), "Teacher Guide");
    await userEvent.type(
      screen.getByLabelText(/article content/i),
      "Use this for class prep."
    );

    // Submit again
    await userEvent.click(screen.getByRole("button", { name: /save article/i }));

    // Verify API call
    await waitFor(() => expect(knowledgeBaseService.createEntry).toHaveBeenCalled());
  });

  /**
   * Test: KnowledgeBaseEdit
   * - Load existing article
   * - Update and save changes
   */
  it("KnowledgeBaseEdit loads and saves", async () => {
    // Mock existing entries (used to find article by ID)
    knowledgeBaseService.getAllEntries.mockResolvedValue([
      {
        id: "kb-1",
        title: "Old",
        content: "Old content",
        category: "Teaching Materials",
        isPublished: true,
        attachmentUrls: [],
      },
    ]);

    // Mock update response
    knowledgeBaseService.updateEntry.mockResolvedValue({});

    renderPage(<KnowledgeBaseEdit />);

    // Ensure existing data is loaded
    expect(await screen.findByDisplayValue("Old")).toBeInTheDocument();

    // Modify title
    await userEvent.clear(screen.getByLabelText(/article title/i));
    await userEvent.type(screen.getByLabelText(/article title/i), "Updated");

    // Submit changes
    await userEvent.click(screen.getByRole("button", { name: /save changes/i }));

    // Verify update API call
    await waitFor(() => expect(knowledgeBaseService.updateEntry).toHaveBeenCalled());
  });

  /**
   * Test: KnowledgeBaseManage
   * - Render list of articles
   * - Verify UI actions
   */
  it("KnowledgeBaseManage UI list", async () => {
    // Mock entries list
    knowledgeBaseService.getAllEntries.mockResolvedValue([
      {
        id: "kb-1",
        title: "Doc",
        content: "Body",
        category: "Teaching Materials",
        isPublished: true,
        updatedAt: new Date().toISOString(),
        attachmentUrls: [],
      },
    ]);

    renderPage(<KnowledgeBaseManage />);

    // Verify article appears
    expect(await screen.findByText("Doc")).toBeInTheDocument();

    // Verify "Add Article" button exists
    expect(screen.getByRole("button", { name: /add article/i })).toBeInTheDocument();
  });
});