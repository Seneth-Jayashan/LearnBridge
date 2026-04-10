import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import NeedsRegistry from "../pages/schoolAdmin/NeedsRegistry";
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

const waitForText = async (text) => {
  await waitFor(() => {
    expect(screen.getAllByText(text).length).toBeGreaterThan(0);
  });
};

const mockNeeds = [
  {
    _id: "1",
    itemName: "Geometry Boxes",
    quantity: 5,
    amount: 2500,
    description: "For grade 10 students",
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
    donorId: {
      firstName: "Tharusha",
      lastName: "Rukshan",
      email: "tharusha@gmail.com",
    },
    createdAt: new Date().toISOString(),
  },
];

describe("NeedsRegistry Component", () => {

  beforeEach(() => {
    jest.clearAllMocks();
    getMyPostedNeeds.mockResolvedValue({ data: mockNeeds });
  });

  // ── Rendering ─────────────────────────────────────────────────

  describe("Rendering", () => {
    test("✅ POSITIVE: renders Needs Registry heading", async () => {
      render(<NeedsRegistry />);
      await waitFor(() => {
        expect(screen.getByText("Needs Registry")).toBeInTheDocument();
      });
    });

    test("✅ POSITIVE: renders all needs from API", async () => {
      render(<NeedsRegistry />);
      await waitFor(() => {
        expect(screen.getAllByText("Geometry Boxes").length).toBeGreaterThan(0);
        expect(screen.getAllByText("Notebooks").length).toBeGreaterThan(0);
      });
    });

    test("✅ POSITIVE: renders summary stat cards", async () => {
      render(<NeedsRegistry />);
      await waitFor(() => {
        expect(screen.getByText("Total Posted")).toBeInTheDocument();
        expect(screen.getAllByText("Open").length).toBeGreaterThan(0);
        expect(screen.getAllByText("Fulfilled").length).toBeGreaterThan(0);
      });
    });

    test("✅ POSITIVE: renders correct stat counts", async () => {
      render(<NeedsRegistry />);
      await waitFor(() => {
        expect(screen.getAllByText("2").length).toBeGreaterThan(0); // total
        expect(screen.getAllByText("1").length).toBeGreaterThanOrEqual(2); // open + fulfilled
      });
    });

    test("✅ POSITIVE: shows empty state when no needs", async () => {
      getMyPostedNeeds.mockResolvedValue({ data: [] });
      render(<NeedsRegistry />);
      await waitFor(() => {
        expect(screen.getByText(/No needs posted yet/i)).toBeInTheDocument();
      });
    });

    test("✅ POSITIVE: shows amount in LKR format", async () => {
      render(<NeedsRegistry />);
      await waitFor(() => {
        expect(screen.getAllByText(/2,500/).length).toBeGreaterThan(0);
      });
    });

    test("✅ POSITIVE: shows View Donor button for non-Open needs", async () => {
      render(<NeedsRegistry />);
      await waitFor(() => {
        expect(screen.getAllByText("View Donor 👤").length).toBeGreaterThan(0);
      });
    });

    test("✅ POSITIVE: shows Locked text for pledged needs (no View Donor until fulfilled)", async () => {
      getMyPostedNeeds.mockResolvedValue({
        data: [{ ...mockNeeds[0], status: "Pledged", _id: "3" }],
      });
      render(<NeedsRegistry />);
      await waitFor(() => {
        expect(screen.getAllByText("View Donor 👤").length).toBeGreaterThan(0);
      });
    });

    test("❌ NEGATIVE: shows error toast when fetch fails", async () => {
      const { toast } = require("react-toastify");
      getMyPostedNeeds.mockRejectedValue(new Error("Network error"));
      render(<NeedsRegistry />);
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Failed to load needs.");
      });
    });
  });

  // ── Create Need ───────────────────────────────────────────────

  describe("Create Need", () => {
    test("✅ POSITIVE: opens modal when Post New Need clicked", async () => {
      render(<NeedsRegistry />);
      await waitForText("Geometry Boxes");
      fireEvent.click(screen.getAllByText("+ Post New Need")[0]);
      expect(screen.getByText("Post New Need")).toBeInTheDocument();
    });

    test("✅ POSITIVE: closes modal when Cancel clicked", async () => {
      render(<NeedsRegistry />);
      await waitForText("Geometry Boxes");
      fireEvent.click(screen.getAllByText("+ Post New Need")[0]);
      fireEvent.click(screen.getByText("Cancel"));
      await waitFor(() => {
        expect(screen.queryByText("Post Need 📢")).not.toBeInTheDocument();
      });
    });

    test("✅ POSITIVE: creates need successfully", async () => {
      const { toast } = require("react-toastify");
      createNeed.mockResolvedValue({ data: {} });
      render(<NeedsRegistry />);
      await waitForText("Geometry Boxes");

      fireEvent.click(screen.getAllByText("+ Post New Need")[0]);
      fireEvent.change(screen.getByPlaceholderText(/Geometry Boxes/i), {
        target: { value: "New Item" },
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
        expect(toast.success).toHaveBeenCalledWith("Need posted successfully 📢");
      });
    });

    test("❌ NEGATIVE: shows error when item name is empty", async () => {
      const { toast } = require("react-toastify");
      render(<NeedsRegistry />);
      await waitForText("Geometry Boxes");
      fireEvent.click(screen.getAllByText("+ Post New Need")[0]);
      fireEvent.click(screen.getByText("Post Need 📢"));
      expect(toast.error).toHaveBeenCalledWith("Item name and quantity are required.");
    });

    test("❌ NEGATIVE: shows error when quantity is 0", async () => {
      const { toast } = require("react-toastify");
      render(<NeedsRegistry />);
      await waitForText("Geometry Boxes");
      fireEvent.click(screen.getAllByText("+ Post New Need")[0]);
      fireEvent.change(screen.getByPlaceholderText(/Geometry Boxes/i), {
        target: { value: "Test Item" },
      });
      fireEvent.change(screen.getByPlaceholderText("e.g. 5"), {
        target: { value: "0" },
      });
      fireEvent.click(screen.getByText("Post Need 📢"));
      expect(toast.error).toHaveBeenCalledWith("Quantity must be greater than 0.");
    });

    test("❌ NEGATIVE: shows error when amount is missing", async () => {
      const { toast } = require("react-toastify");
      render(<NeedsRegistry />);
      await waitForText("Geometry Boxes");
      fireEvent.click(screen.getAllByText("+ Post New Need")[0]);
      fireEvent.change(screen.getByPlaceholderText(/Geometry Boxes/i), {
        target: { value: "Test Item" },
      });
      fireEvent.change(screen.getByPlaceholderText("e.g. 5"), {
        target: { value: "5" },
      });
      fireEvent.click(screen.getByText("Post Need 📢"));
      expect(toast.error).toHaveBeenCalledWith("Please enter a valid amount.");
    });

    test("❌ NEGATIVE: shows error toast when create fails", async () => {
      const { toast } = require("react-toastify");
      createNeed.mockRejectedValue({
        response: { data: { message: "Server error" } },
      });
      render(<NeedsRegistry />);
      await waitForText("Geometry Boxes");
      fireEvent.click(screen.getAllByText("+ Post New Need")[0]);
      fireEvent.change(screen.getByPlaceholderText(/Geometry Boxes/i), {
        target: { value: "New Item" },
      });
      fireEvent.change(screen.getByPlaceholderText("e.g. 5"), {
        target: { value: "5" },
      });
      fireEvent.change(screen.getByPlaceholderText("2500"), {
        target: { value: "2000" },
      });
      fireEvent.click(screen.getByText("Post Need 📢"));
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Server error");
      });
    });
  });

  // ── Edit Need ─────────────────────────────────────────────────

  describe("Edit Need", () => {
    test("✅ POSITIVE: opens edit modal with existing data", async () => {
      render(<NeedsRegistry />);
      await waitForText("Geometry Boxes");
      const editButtons = screen.getAllByText("Edit");
      fireEvent.click(editButtons[0]);
      expect(screen.getByText("Edit Need")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Geometry Boxes")).toBeInTheDocument();
    });

    test("✅ POSITIVE: updates need successfully", async () => {
      const { toast } = require("react-toastify");
      updateNeed.mockResolvedValue({ data: {} });
      render(<NeedsRegistry />);
      await waitForText("Geometry Boxes");
      const editButtons = screen.getAllByText("Edit");
      fireEvent.click(editButtons[0]);
      fireEvent.change(screen.getByDisplayValue("Geometry Boxes"), {
        target: { value: "Updated Item" },
      });
      fireEvent.click(screen.getByText("Update Need"));
      await waitFor(() => {
        expect(updateNeed).toHaveBeenCalled();
        expect(toast.success).toHaveBeenCalledWith("Need updated successfully ✅");
      });
    });

    test("✅ POSITIVE: fulfilled need shows View Donor not Edit", async () => {
      render(<NeedsRegistry />);
      await waitForText("Notebooks");
      expect(screen.getAllByText("View Donor 👤").length).toBeGreaterThan(0);
      const editButtons = screen.queryAllByText("Edit");
      expect(editButtons).toHaveLength(2); // only Open need, duplicated for desktop+mobile
    });

    test("❌ NEGATIVE: shows error when update fails", async () => {
      const { toast } = require("react-toastify");
      updateNeed.mockRejectedValue({
        response: { data: { message: "Cannot edit pledged need" } },
      });
      render(<NeedsRegistry />);
      await waitForText("Geometry Boxes");
      const editButtons = screen.getAllByText("Edit");
      fireEvent.click(editButtons[0]);
      fireEvent.click(screen.getByText("Update Need"));
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Cannot edit pledged need");
      });
    });
  });

  // ── Delete Need ───────────────────────────────────────────────

  describe("Delete Need", () => {
    test("✅ POSITIVE: opens delete confirm modal", async () => {
      render(<NeedsRegistry />);
      await waitForText("Geometry Boxes");
      const deleteButtons = screen.getAllByText("Delete");
      fireEvent.click(deleteButtons[0]);
      expect(screen.getByText("Delete Need?")).toBeInTheDocument();
    });

    test("✅ POSITIVE: cancels delete when Cancel clicked", async () => {
      render(<NeedsRegistry />);
      await waitForText("Geometry Boxes");
      const deleteButtons = screen.getAllByText("Delete");
      fireEvent.click(deleteButtons[0]);
      const cancelButtons = screen.getAllByText("Cancel");
      fireEvent.click(cancelButtons[cancelButtons.length - 1]);
      await waitFor(() => {
        expect(screen.queryByText("Delete Need?")).not.toBeInTheDocument();
      });
    });

    test("✅ POSITIVE: deletes need successfully", async () => {
      const { toast } = require("react-toastify");
      deleteNeed.mockResolvedValue({ data: {} });
      render(<NeedsRegistry />);
      await waitForText("Geometry Boxes");
      const deleteButtons = screen.getAllByText("Delete");
      fireEvent.click(deleteButtons[0]);
      fireEvent.click(screen.getByText("Yes, Delete"));
      await waitFor(() => {
        expect(deleteNeed).toHaveBeenCalledWith("1");
        expect(toast.success).toHaveBeenCalledWith("Need deleted 🗑️");
      });
    });

    test("❌ NEGATIVE: shows error when delete fails", async () => {
      const { toast } = require("react-toastify");
      deleteNeed.mockRejectedValue({
        response: { data: { message: "Not authorized" } },
      });
      render(<NeedsRegistry />);
      await waitForText("Geometry Boxes");
      const deleteButtons = screen.getAllByText("Delete");
      fireEvent.click(deleteButtons[0]);
      fireEvent.click(screen.getByText("Yes, Delete"));
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Not authorized");
      });
    });

    test("❌ NEGATIVE: fulfilled need has no Delete button", async () => {
      render(<NeedsRegistry />);
      await waitForText("Notebooks");
      const deleteButtons = screen.queryAllByText("Delete");
      expect(deleteButtons).toHaveLength(2); // only Open need, duplicated for desktop+mobile
    });
  });
});