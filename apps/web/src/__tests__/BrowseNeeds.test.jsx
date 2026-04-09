// apps/web/src/__tests__/BrowseNeeds.test.jsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import BrowseNeeds from "../pages/Donor/BrowseNeeds";
import {
  getAllNeeds,
  pledgeDonation,
  initiatePayment,
  confirmPayment,
} from "../services/donorServices";

jest.mock("react-toastify", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock("../services/donorServices");

const mockNeeds = [
  {
    _id: "1",
    itemName: "Projector Screen",
    quantity: 1,
    amount: 15000,
    description: "For hall presentations",
    urgency: "High",
    status: "Open",
    schoolId: { firstName: "Tharusha", lastName: "Rukshan" },
    pledgedDate: null,
  },
  {
    _id: "2",
    itemName: "Notebooks",
    quantity: 20,
    amount: 0,
    description: "A4 notebooks",
    urgency: "Low",
    status: "Pledged",
    schoolId: { firstName: "School", lastName: "Admin" },
    pledgedDate: new Date().toISOString(),
  },
];

describe("BrowseNeeds Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getAllNeeds.mockResolvedValue({ data: mockNeeds });
    window.payhere = {
      startPayment: jest.fn(),
      onCompleted: null,
      onDismissed: null,
      onError: null,
    };
  });

  // ── POSITIVE TEST CASES ──────────────────────────────────────
  describe("Positive Tests", () => {
    test("renders Browse School Needs heading", async () => {
      render(<BrowseNeeds />);
      await waitFor(() => {
        expect(screen.getByText("Browse School Needs")).toBeInTheDocument();
      });
    });

    test("renders needs from API", async () => {
      render(<BrowseNeeds />);
      await waitFor(() => {
        expect(screen.getByText("Projector Screen")).toBeInTheDocument();
        expect(screen.getByText("Notebooks")).toBeInTheDocument();
      });
    });

    test("shows result count", async () => {
      render(<BrowseNeeds />);
      await waitFor(() => {
        expect(screen.getByText(/Showing 2 of 2/i)).toBeInTheDocument();
      });
    });

    test("filters needs by search", async () => {
      render(<BrowseNeeds />);
      await waitFor(() => screen.getByText("Projector Screen"));
      fireEvent.change(screen.getByPlaceholderText("Search item..."), {
        target: { value: "Projector" },
      });
      await waitFor(() => {
        expect(screen.getByText("Projector Screen")).toBeInTheDocument();
        expect(screen.queryByText("Notebooks")).not.toBeInTheDocument();
      });
    });

    test("filters needs by urgency", async () => {
      render(<BrowseNeeds />);
      await waitFor(() => screen.getByText("Projector Screen"));
      fireEvent.change(screen.getByDisplayValue("All Urgency"), {
        target: { value: "High" },
      });
      await waitFor(() => {
        expect(screen.getByText("Projector Screen")).toBeInTheDocument();
      });
    });

    test("filters needs by status", async () => {
      render(<BrowseNeeds />);
      await waitFor(() => screen.getByText("Projector Screen"));
      fireEvent.change(screen.getByDisplayValue("All Status"), {
        target: { value: "Pledged" },
      });
      await waitFor(() => {
        expect(screen.getByText("Notebooks")).toBeInTheDocument();
      });
    });

    test("clears filters", async () => {
      render(<BrowseNeeds />);
      await waitFor(() => screen.getByText("Projector Screen"));
      fireEvent.change(screen.getByPlaceholderText("Search item..."), {
        target: { value: "Projector" },
      });
      fireEvent.click(screen.getByText("Clear Filters"));
      await waitFor(() => {
        expect(screen.getByText("Projector Screen")).toBeInTheDocument();
        expect(screen.getByText("Notebooks")).toBeInTheDocument();
      });
    });

    test("pledges successfully", async () => {
      const { toast } = require("react-toastify");
      pledgeDonation.mockResolvedValue({ data: {} });

      render(<BrowseNeeds />);
      await waitFor(() => screen.getByText("Pledge 🤝"));
      fireEvent.click(screen.getByText("Pledge 🤝"));
      await waitFor(() => {
        expect(pledgeDonation).toHaveBeenCalledWith("1");
        expect(toast.success).toHaveBeenCalledWith(
          "Thank you for supporting this school ❤️"
        );
      });
    });

    test("initiates payment successfully", async () => {
      initiatePayment.mockResolvedValue({
        data: { sandbox: true, merchant_id: "1233185", amount: "15000.00" },
      });
      render(<BrowseNeeds />);
      await waitFor(() => screen.getByText("Pay 💳"));
      fireEvent.click(screen.getByText("Pay 💳"));
      await waitFor(() => {
        expect(initiatePayment).toHaveBeenCalledWith("1");
        expect(window.payhere.startPayment).toHaveBeenCalled();
      });
    });

    test("shows Open status badge", async () => {
      render(<BrowseNeeds />);
      await waitFor(() => {
        expect(
          screen.getAllByText("Open", { selector: "span" }).length
        ).toBeGreaterThan(0);
      });
    });

    test("shows Pledged status badge", async () => {
      render(<BrowseNeeds />);
      await waitFor(() => {
        expect(
          screen.getAllByText("Pledged", { selector: "span" }).length
        ).toBeGreaterThan(0);
      });
    });

    test("shows amount in LKR", async () => {
      render(<BrowseNeeds />);
      await waitFor(() => {
        expect(screen.getByText("15,000")).toBeInTheDocument();
      });
    });
  });

  // ── NEGATIVE TEST CASES ──────────────────────────────────────
  describe("Negative Tests", () => {
    test("shows empty state when no needs", async () => {
      getAllNeeds.mockResolvedValue({ data: [] });
      render(<BrowseNeeds />);
      await waitFor(() => {
        expect(screen.getByText("No needs found")).toBeInTheDocument();
      });
    });

    test("shows error toast when fetch fails", async () => {
      const { toast } = require("react-toastify");
      getAllNeeds.mockRejectedValue(new Error("Network error"));
      render(<BrowseNeeds />);
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Failed to load needs.");
      });
    });

    test("shows error when pledge fails", async () => {
      const { toast } = require("react-toastify");
      pledgeDonation.mockRejectedValue({
        response: { data: { message: "Already pledged" } },
      });
      render(<BrowseNeeds />);
      await waitFor(() => screen.getByText("Pledge 🤝"));
      fireEvent.click(screen.getByText("Pledge 🤝"));
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Already pledged");
      });
    });

    test("shows error when payment initiation fails", async () => {
      const { toast } = require("react-toastify");
      initiatePayment.mockRejectedValue({
        response: { data: { message: "Payment config missing" } },
      });
      render(<BrowseNeeds />);
      await waitFor(() => screen.getByText("Pay 💳"));
      fireEvent.click(screen.getByText("Pay 💳"));
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Payment config missing");
      });
    });

    test("does not render Pay button when amount is 0", async () => {
      render(<BrowseNeeds />);
      await waitFor(() => screen.getByText("Notebooks"));
      const payButtons = screen.queryAllByText("Pay 💳");
      expect(payButtons.length).toBe(1); // only Projector Screen has amount
    });
  });
});