import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import MyDonations from "../pages/Donor/MyDonation";
import { getMyDonations, markFulfilled } from "../services/donorServices";

jest.mock("react-toastify", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock("../services/donorServices");

const mockData = [
  {
    _id: "1",
    itemName: "Books",
    quantity: 10,
    status: "Pledged",
  },
  {
    _id: "2",
    itemName: "Pens",
    quantity: 5,
    status: "Fulfilled",
  },
];

describe("MyDonations Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getMyDonations.mockResolvedValue({ data: mockData });
  });

  // ─────────────────────────────────────────
  // POSITIVE TEST CASES
  // ─────────────────────────────────────────
  describe("Positive Tests", () => {
    test("renders loading spinner", () => {
      getMyDonations.mockImplementation(() => new Promise(() => {}));
      render(<MyDonations />);
      expect(document.querySelector(".animate-spin")).toBeTruthy();
    });

    test("renders header and stats", async () => {
      render(<MyDonations />);
      await waitFor(() => {
        expect(screen.getByText("My Donations")).toBeInTheDocument();
        expect(screen.getByText("Total Pledges")).toBeInTheDocument();
      });
    });

    test("filters pending tab", async () => {
      render(<MyDonations />);
      await waitFor(() => screen.getByText("Books"));

      fireEvent.click(screen.getByRole("button", { name: /pending/i }));

      expect(screen.getByText("Books")).toBeInTheDocument();
    });

    test("filters completed tab", async () => {
      render(<MyDonations />);
      await waitFor(() => screen.getByText("Pens"));

      fireEvent.click(screen.getByRole("button", { name: /completed/i }));

      expect(screen.getByText("Pens")).toBeInTheDocument();
    });

    test("marks donation as fulfilled", async () => {
      const { toast } = require("react-toastify");
      markFulfilled.mockResolvedValue({ data: {} });

      render(<MyDonations />);
      await waitFor(() => screen.getByText("Books"));

      fireEvent.click(screen.getByText("Mark as Fulfilled ✅"));

      await waitFor(() => {
        expect(markFulfilled).toHaveBeenCalledWith("1");
        expect(toast.success).toHaveBeenCalledWith(
          "Marked as fulfilled! 🎉"
        );
      });
    });
  });

  // ─────────────────────────────────────────
  // NEGATIVE TEST CASES
  // ─────────────────────────────────────────
  describe("Negative Tests", () => {
    test("handles fulfill error", async () => {
      const { toast } = require("react-toastify");

      markFulfilled.mockRejectedValue({
        response: { data: { message: "Error" } },
      });

      render(<MyDonations />);
      await waitFor(() => screen.getByText("Books"));

      fireEvent.click(screen.getByText("Mark as Fulfilled ✅"));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Error");
      });
    });
  });
});