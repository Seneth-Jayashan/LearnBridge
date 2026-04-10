// Import testing utilities
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Router wrapper
import { MemoryRouter } from "react-router-dom";

// Vitest core functions
import { vi, describe, it, expect, beforeEach } from "vitest";

// Import components under test
import KnowledgeBaseList from "../../../pages/KnowledgeBase/KnowledgeBaseList";
import KnowledgeBasePublic from "../../../pages/KnowledgeBase/KnowledgeBasePublic";
import KnowledgeBaseDetail from "../../../pages/KnowledgeBase/KnowledgeBaseDetail";

// Import service (will be mocked)
import knowledgeBaseService from "../../../services/KnowledgeBaseService";

// Mock navigation
const mockNavigate = vi.fn();

/**
 * Mock KnowledgeBaseService
 * - Prevents real API calls
 * - Allows controlled responses for testing
 */
vi.mock("../../../services/KnowledgeBaseService", () => ({
  default: {
    getPublicEntries: vi.fn(),
    getPublicEntry: vi.fn(),
    getAttachmentDownloadUrl: vi.fn(),
  },
}));

/**
 * Mock React Router
 * - useNavigate → track navigation calls
 * - useParams → simulate route param (article ID)
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
 * Helper function to wrap components with router context
 */
const renderPage = (node) => render(<MemoryRouter>{node}</MemoryRouter>);

/**
 * Test Suite: Public Knowledge Base Pages
 */
describe("Public knowledge base pages", () => {

  /**
   * Reset mocks before each test
   */
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Test: KnowledgeBaseList
   * - Verify empty state message when no entries exist
   */
  it("KnowledgeBaseList UI empty state", () => {
    renderPage(<KnowledgeBaseList entries={[]} emptyMessage="Nothing yet" />);

    // Expect empty message to be displayed
    expect(screen.getByText(/nothing yet/i)).toBeInTheDocument();
  });

  /**
   * Test: KnowledgeBasePublic
   * - Positive case: API returns entries
   * - Verify list rendering and category filter button
   */
  it("KnowledgeBasePublic positive list render", async () => {
    // Mock API response
    knowledgeBaseService.getPublicEntries.mockResolvedValue([
      {
        _id: "kb-1",
        title: "Intro",
        category: "Academics",
        authorName: "A",
        createdAt: new Date().toISOString(),
      },
    ]);

    renderPage(<KnowledgeBasePublic />);

    // Ensure article appears
    expect(await screen.findByText("Intro")).toBeInTheDocument();

    // Ensure category button/filter exists
    expect(screen.getByRole("button", { name: /academics/i })).toBeInTheDocument();
  });

  /**
   * Test: KnowledgeBasePublic
   * - Negative case: API failure
   * - Verify error message is shown
   */
  it("KnowledgeBasePublic negative api failure", async () => {
    // Mock API failure
    knowledgeBaseService.getPublicEntries.mockRejectedValue(new Error("boom"));

    renderPage(<KnowledgeBasePublic />);

    // Expect error message
    expect(await screen.findByText(/failed to load knowledge base/i)).toBeInTheDocument();
  });

  /**
   * Test: KnowledgeBaseDetail
   * - Load single article
   * - Verify navigation via back button
   */
  it("KnowledgeBaseDetail shows article and back button", async () => {
    // Mock API response for single article
    knowledgeBaseService.getPublicEntry.mockResolvedValue({
      id: "kb-1",
      title: "Safe Learning",
      category: "General",
      content: "Body",
      updatedAt: new Date().toISOString(),
      attachmentUrls: [],
    });

    renderPage(<KnowledgeBaseDetail />);

    // Ensure article content is rendered
    expect(await screen.findByText("Safe Learning")).toBeInTheDocument();

    // Click back button
    await userEvent.click(
      screen.getByRole("button", { name: /back to knowledge base/i })
    );

    // Verify navigation triggered
    expect(mockNavigate).toHaveBeenCalled();
  });
});