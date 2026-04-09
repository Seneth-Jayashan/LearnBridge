import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import NeedsRegistry from "../pages/SchoolAdmin/NeedsRegistry";
import {
  getMyPostedNeeds,
  createNeed,
  updateNeed,
  deleteNeed,
} from "../services/donorServices";

jest.mock("react-toastify", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

jest.mock("../services/donorServices");

const mockNeeds = [
  {
    _id: "1",
    itemName: "Geometry Boxes",
    quantity: 5,
    amount: 2500,
    description: "For grade 10",
    urgency: "High",
    status: "Open",
    createdAt: new Date().toISOString(),
  },
  {
    _id: "2",
    itemName: "Notebooks",
    quantity: 20,
    amount: 1500,
    description: "A4 notebooks",
    urgency: "Medium",
    status: "Fulfilled",
    createdAt: new Date().toISOString(),
  },
];

describe("NeedsRegistry Component", () => {
  const waitForNeedsToRender = async () => {
    await waitFor(() => {
      expect(screen.getAllByText("Geometry Boxes").length).toBeGreaterThan(0);
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    getMyPostedNeeds.mockResolvedValue({ data: mockNeeds });
  });

  // ─────────────────────────────────────────
  // POSITIVE TEST CASES
  // ─────────────────────────────────────────
  describe("Positive Tests", () => {
    test("renders loading spinner initially", () => {
      getMyPostedNeeds.mockImplementation(() => new Promise(() => {}));
      render(<NeedsRegistry />);
      expect(document.querySelector(".animate-spin")).toBeTruthy();
    });

    test("renders needs registry heading", async () => {
      render(<NeedsRegistry />);
      await waitFor(() => {
        expect(screen.getByText("Needs Registry")).toBeInTheDocument();
      });
    });

    test("renders all needs from API", async () => {
      render(<NeedsRegistry />);
      await waitFor(() => {
        expect(screen.getAllByText("Geometry Boxes").length).toBeGreaterThan(0);
        expect(screen.getAllByText("Notebooks").length).toBeGreaterThan(0);
      });
    });

    test("renders summary cards with correct counts", async () => {
      render(<NeedsRegistry />);
      await waitFor(() => {
        expect(screen.getByText("Total Posted")).toBeInTheDocument();
        expect(screen.getAllByText("Open").length).toBeGreaterThan(0);
        expect(screen.getAllByText("Fulfilled").length).toBeGreaterThan(0);
      });
    });

    test("opens post new need modal", async () => {
      render(<NeedsRegistry />);
      await waitForNeedsToRender();

      fireEvent.click(screen.getByText("+ Post New Need"));

      expect(screen.getByText("Post New Need")).toBeInTheDocument();
    });

    test("creates need successfully", async () => {
      const { toast } = require("react-toastify");
      createNeed.mockResolvedValue({ data: {} });

      render(<NeedsRegistry />);
      await waitForNeedsToRender();

      fireEvent.click(screen.getByText("+ Post New Need"));

      fireEvent.change(screen.getByPlaceholderText(/Geometry Boxes/i), {
        target: { value: "Test Item" },
      });
      fireEvent.change(screen.getByPlaceholderText("e.g. 5"), {
        target: { value: "10" },
      });
      fireEvent.change(screen.getByPlaceholderText("2500"), {
        target: { value: "3000" },
      });

      fireEvent.click(screen.getByText("Post Need 📢"));

      await waitFor(() => {
        expect(createNeed).toHaveBeenCalled();
        expect(toast.success).toHaveBeenCalledWith(
          "Need posted successfully 📢"
        );
      });
    });

    test("updates need successfully", async () => {
      const { toast } = require("react-toastify");
      updateNeed.mockResolvedValue({ data: {} });

      render(<NeedsRegistry />);
      await waitForNeedsToRender();

      fireEvent.click(screen.getAllByText("Edit")[0]);

      fireEvent.change(screen.getByDisplayValue("Geometry Boxes"), {
        target: { value: "Updated Item" },
      });

      fireEvent.click(screen.getByText("Update Need"));

      await waitFor(() => {
        expect(updateNeed).toHaveBeenCalled();
        expect(toast.success).toHaveBeenCalledWith(
          "Need updated successfully ✅"
        );
      });
    });

    test("deletes need successfully", async () => {
      const { toast } = require("react-toastify");
      deleteNeed.mockResolvedValue({ data: {} });

      render(<NeedsRegistry />);
      await waitForNeedsToRender();

      fireEvent.click(screen.getAllByText("Delete")[0]);
      fireEvent.click(screen.getByText("Yes, Delete"));

      await waitFor(() => {
        expect(deleteNeed).toHaveBeenCalledWith("1");
        expect(toast.success).toHaveBeenCalledWith("Need deleted 🗑️");
      });
    });
  });

  // ─────────────────────────────────────────
  // NEGATIVE TEST CASES
  // ─────────────────────────────────────────
  describe("Negative Tests", () => {
    test("shows empty state when no needs", async () => {
      getMyPostedNeeds.mockResolvedValue({ data: [] });

      render(<NeedsRegistry />);

      await waitFor(() => {
        expect(screen.getByText(/No needs posted yet/i)).toBeInTheDocument();
      });
    });

    test("shows error toast when fetch fails", async () => {
      const { toast } = require("react-toastify");
      getMyPostedNeeds.mockRejectedValue(new Error("Network error"));

      render(<NeedsRegistry />);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Failed to load needs.");
      });
    });

    test("shows error when submitting empty form", async () => {
      const { toast } = require("react-toastify");

      render(<NeedsRegistry />);
      await waitForNeedsToRender();

      fireEvent.click(screen.getByText("+ Post New Need"));
      fireEvent.click(screen.getByText("Post Need 📢"));

      expect(toast.error).toHaveBeenCalledWith(
        "Item name and quantity are required."
      );
    });

    test("shows error when quantity is 0", async () => {
      const { toast } = require("react-toastify");

      render(<NeedsRegistry />);
      await waitForNeedsToRender();

      fireEvent.click(screen.getByText("+ Post New Need"));

      fireEvent.change(screen.getByPlaceholderText(/Geometry Boxes/i), {
        target: { value: "Test Item" },
      });

      fireEvent.change(screen.getByPlaceholderText("e.g. 5"), {
        target: { value: "0" },
      });

      fireEvent.click(screen.getByText("Post Need 📢"));

      expect(toast.error).toHaveBeenCalledWith(
        "Quantity must be greater than 0."
      );
    });

    test("shows error when amount is missing", async () => {
      const { toast } = require("react-toastify");

      render(<NeedsRegistry />);
      await waitForNeedsToRender();

      fireEvent.click(screen.getByText("+ Post New Need"));

      fireEvent.change(screen.getByPlaceholderText(/Geometry Boxes/i), {
        target: { value: "Test Item" },
      });

      fireEvent.change(screen.getByPlaceholderText("e.g. 5"), {
        target: { value: "5" },
      });

      fireEvent.click(screen.getByText("Post Need 📢"));

      expect(toast.error).toHaveBeenCalledWith(
        "Please enter a valid amount."
      );
    });

    test("handles delete error", async () => {
      const { toast } = require("react-toastify");

      deleteNeed.mockRejectedValue({
        response: { data: { message: "Not authorized" } },
      });

      render(<NeedsRegistry />);
      await waitForNeedsToRender();

      fireEvent.click(screen.getAllByText("Delete")[0]);
      fireEvent.click(screen.getByText("Yes, Delete"));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Not authorized");
      });
    });
  });
});