import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import BrowseNeeds from "../pages/donor/BrowseNeeds";
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

const waitForText = async (text) => {
  await waitFor(() => {
    expect(screen.getAllByText(text).length).toBeGreaterThan(0);
  });
};

const mockNeeds = [
  {
    _id: "1",
    itemName: "Projector Screen",
    quantity: 1,
    amount: 15000,
    description: "For hall presentations",
    urgency: "High",
    status: "Open",
    schoolId: { firstName: "School", lastName: "Admin" },
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
    schoolId: { firstName: "Another", lastName: "School" },
    pledgedDate: new Date().toISOString(),
  },
  {
    _id: "3",
    itemName: "Geometry Boxes",
    quantity: 5,
    amount: 2500,
    description: "For grade 10",
    urgency: "Medium",
    status: "Fulfilled",
    schoolId: { firstName: "Third", lastName: "School" },
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

  // ── Rendering ─────────────────────────────────────────────────

  describe("Rendering", () => {
    test("✅ POSITIVE: renders heading", async () => {
      render(<BrowseNeeds />);
      await waitFor(() => {
        expect(screen.getByText("Browse School Needs")).toBeInTheDocument();
      });
    });

    test("✅ POSITIVE: renders all needs", async () => {
      render(<BrowseNeeds />);
      await waitFor(() => {
        expect(screen.getAllByText("Projector Screen").length).toBeGreaterThan(0);
        expect(screen.getAllByText("Notebooks").length).toBeGreaterThan(0);
        expect(screen.getAllByText("Geometry Boxes").length).toBeGreaterThan(0);
      });
    });

    test("✅ POSITIVE: shows result count", async () => {
      render(<BrowseNeeds />);
      await waitFor(() => {
        expect(screen.getByText(/Showing 3 of 3/i)).toBeInTheDocument();
      });
    });

    test("✅ POSITIVE: shows amount in Rs format", async () => {
      render(<BrowseNeeds />);
      await waitFor(() => {
        expect(screen.getAllByText("15,000").length).toBeGreaterThan(0);
      });
    });

    test("✅ POSITIVE: shows empty state when no needs", async () => {
      getAllNeeds.mockResolvedValue({ data: [] });
      render(<BrowseNeeds />);
      await waitFor(() => {
        expect(screen.getByText("No needs found")).toBeInTheDocument();
      });
    });

    test("❌ NEGATIVE: shows error toast when fetch fails", async () => {
      const { toast } = require("react-toastify");
      getAllNeeds.mockRejectedValue(new Error("Network error"));
      render(<BrowseNeeds />);
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Failed to load needs.");
      });
    });
  });

  // ── Filters ───────────────────────────────────────────────────

  describe("Filters", () => {
    test("✅ POSITIVE: filters by search term", async () => {
      render(<BrowseNeeds />);
      await waitForText("Projector Screen");
      fireEvent.change(screen.getByPlaceholderText("Search item..."), {
        target: { value: "Projector" },
      });
      await waitFor(() => {
        expect(screen.getAllByText("Projector Screen").length).toBeGreaterThan(0);
        expect(screen.queryAllByText("Notebooks")).toHaveLength(0);
      });
    });

    test("✅ POSITIVE: filters by urgency High", async () => {
      render(<BrowseNeeds />);
      await waitForText("Projector Screen");
      fireEvent.change(screen.getByDisplayValue("All Urgency"), {
        target: { value: "High" },
      });
      await waitFor(() => {
        expect(screen.getAllByText("Projector Screen").length).toBeGreaterThan(0);
        expect(screen.queryAllByText("Notebooks")).toHaveLength(0);
      });
    });

    test("✅ POSITIVE: filters by status Open", async () => {
      render(<BrowseNeeds />);
      await waitForText("Projector Screen");
      fireEvent.change(screen.getByDisplayValue("All Status"), {
        target: { value: "Open" },
      });
      await waitFor(() => {
        expect(screen.getAllByText("Projector Screen").length).toBeGreaterThan(0);
        expect(screen.queryAllByText("Notebooks")).toHaveLength(0);
      });
    });

    test("✅ POSITIVE: clears all filters", async () => {
      render(<BrowseNeeds />);
      await waitForText("Projector Screen");
      fireEvent.change(screen.getByPlaceholderText("Search item..."), {
        target: { value: "Projector" },
      });
      fireEvent.click(screen.getByText("Clear Filters"));
      await waitFor(() => {
        expect(screen.getAllByText("Projector Screen").length).toBeGreaterThan(0);
        expect(screen.getAllByText("Notebooks").length).toBeGreaterThan(0);
      });
    });

    test("❌ NEGATIVE: shows no results for unknown search", async () => {
      render(<BrowseNeeds />);
      await waitForText("Projector Screen");
      fireEvent.change(screen.getByPlaceholderText("Search item..."), {
        target: { value: "XYZNOTEXIST" },
      });
      await waitFor(() => {
        expect(screen.getByText("No needs found")).toBeInTheDocument();
      });
    });
  });

  // ── Pledge ────────────────────────────────────────────────────

  describe("Pledge", () => {
    test("✅ POSITIVE: shows Pledge button for Open needs", async () => {
      render(<BrowseNeeds />);
      await waitFor(() => {
        expect(screen.getAllByText("Pledge 🤝").length).toBeGreaterThan(0);
      });
    });

    test("✅ POSITIVE: pledges successfully", async () => {
      const { toast } = require("react-toastify");
      pledgeDonation.mockResolvedValue({ data: {} });
      render(<BrowseNeeds />);
      await waitForText("Pledge 🤝");
      fireEvent.click(screen.getAllByText("Pledge 🤝")[0]);
      await waitFor(() => {
        expect(pledgeDonation).toHaveBeenCalledWith("1");
        expect(toast.success).toHaveBeenCalledWith(
          "Thank you for supporting this school ❤️"
        );
      });
    });

    test("❌ NEGATIVE: shows error when pledge fails", async () => {
      const { toast } = require("react-toastify");
      pledgeDonation.mockRejectedValue({
        response: { data: { message: "Already pledged" } },
      });
      render(<BrowseNeeds />);
      await waitForText("Pledge 🤝");
      fireEvent.click(screen.getAllByText("Pledge 🤝")[0]);
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Already pledged");
      });
    });

    test("❌ NEGATIVE: no Pledge button for Pledged status", async () => {
      render(<BrowseNeeds />);
      await waitForText("Notebooks");
      const pledgeButtons = screen.queryAllByText("Pledge 🤝");
      expect(pledgeButtons).toHaveLength(1); // only Open need
    });
  });

  // ── Payment ───────────────────────────────────────────────────

  describe("Payment", () => {
    test("✅ POSITIVE: shows Pay button for Open needs with amount", async () => {
      render(<BrowseNeeds />);
      await waitFor(() => {
        expect(screen.getAllByText("Pay 💳").length).toBeGreaterThan(0);
      });
    });

    test("✅ POSITIVE: does not show Pay button when amount is 0", async () => {
      render(<BrowseNeeds />);
      await waitForText("Notebooks");
      const payButtons = screen.queryAllByText("Pay 💳");
      expect(payButtons).toHaveLength(1); // only Projector Screen
    });

    test("✅ POSITIVE: initiates payment and calls startPayment", async () => {
      initiatePayment.mockResolvedValue({
        data: {
          sandbox: true,
          merchant_id: "1233185",
          amount: "15000.00",
          order_id: "ORDER_1_123456",
        },
      });
      render(<BrowseNeeds />);
      await waitForText("Pay 💳");
      fireEvent.click(screen.getAllByText("Pay 💳")[0]);
      await waitFor(() => {
        expect(initiatePayment).toHaveBeenCalledWith("1");
        expect(window.payhere.startPayment).toHaveBeenCalled();
      });
    });

    test("❌ NEGATIVE: shows error when payment initiation fails", async () => {
      const { toast } = require("react-toastify");
      initiatePayment.mockRejectedValue({
        response: { data: { message: "Payment config missing" } },
      });
      render(<BrowseNeeds />);
      await waitForText("Pay 💳");
      fireEvent.click(screen.getAllByText("Pay 💳")[0]);
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Payment config missing");
      });
    });

    test("❌ NEGATIVE: shows error when payhere not loaded", async () => {
      const { toast } = require("react-toastify");
      window.payhere = undefined;
      render(<BrowseNeeds />);
      await waitForText("Pay 💳");
      fireEvent.click(screen.getAllByText("Pay 💳")[0]);
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          expect.stringContaining("Payment system")
        );
      });
    });
  });

  // ── Status Display ────────────────────────────────────────────

  describe("Status Display", () => {
    test("✅ POSITIVE: shows Open badge", async () => {
      render(<BrowseNeeds />);
      await waitFor(() => {
        expect(screen.getAllByText("Open").length).toBeGreaterThan(0);
      });
    });

    test("✅ POSITIVE: shows Pledged badge", async () => {
      render(<BrowseNeeds />);
      await waitFor(() => {
        expect(screen.getAllByText("Pledged").length).toBeGreaterThan(0);
      });
    });

    test("✅ POSITIVE: shows Fulfilled badge", async () => {
      render(<BrowseNeeds />);
      await waitFor(() => {
        expect(screen.getAllByText("Fulfilled").length).toBeGreaterThan(0);
      });
    });
  });
});