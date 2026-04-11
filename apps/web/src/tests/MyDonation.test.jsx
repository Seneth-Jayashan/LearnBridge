import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import MyDonations from "../pages/Donor/MyDonation";
import { getMyDonations, markFulfilled } from "../services/donorServices";

jest.mock("react-toastify", () => ({
  toast: {
    info: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock("../services/donorServices");

const mockDonations = [
  {
    _id: "pledged-1",
    itemName: "School Bags",
    quantity: 10,
    status: "Pledged",
    schoolId: { name: "Neluwa School" },
    pledgedDate: "2026-04-01T10:00:00.000Z",
  },
  {
    _id: "fulfilled-1",
    itemName: "Math Books",
    quantity: 20,
    status: "Fulfilled",
    schoolId: { name: "Panadura School" },
    pledgedDate: "2026-03-01T10:00:00.000Z",
    fulfilledDate: "2026-03-25T10:00:00.000Z",
  },
];

describe("MyDonations Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getMyDonations.mockResolvedValue({ data: mockDonations });
  });

  test("renders donor donation summary and cards", async () => {
    render(<MyDonations />);

    await waitFor(() => {
      expect(screen.getByText("My Donations")).toBeInTheDocument();
      expect(screen.getAllByText("School Bags").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Math Books").length).toBeGreaterThan(0);
      expect(screen.getByText("Total Pledges")).toBeInTheDocument();
      expect(screen.getAllByText("2").length).toBeGreaterThan(0);
    });
  });

  test("filters donations when switching tabs", async () => {
    render(<MyDonations />);

    await waitFor(() => {
      expect(screen.getAllByText("School Bags").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Math Books").length).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getByRole("button", { name: /pending/i }));
    await waitFor(() => {
      expect(screen.getAllByText("School Bags").length).toBeGreaterThan(0);
      expect(screen.queryAllByText("Math Books")).toHaveLength(0);
    });

    fireEvent.click(screen.getByRole("button", { name: /completed/i }));
    await waitFor(() => {
      expect(screen.getAllByText("Math Books").length).toBeGreaterThan(0);
      expect(screen.queryAllByText("School Bags")).toHaveLength(0);
    });
  });

  test("marks pledged donation as fulfilled", async () => {
    const { toast } = require("react-toastify");
    markFulfilled.mockResolvedValue({ data: {} });

    render(<MyDonations />);

    await waitFor(() => {
      expect(screen.getAllByText("School Bags").length).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getByRole("button", { name: /mark as fulfilled/i }));

    await waitFor(() => {
      expect(markFulfilled).toHaveBeenCalledWith("pledged-1");
      expect(getMyDonations).toHaveBeenCalledTimes(2);
      expect(toast.success).toHaveBeenCalledWith(
        "Marked as fulfilled! 🎉 Thank you for completing your donation!"
      );
    });
  });

  test("shows toast on initial donor donations load failure", async () => {
    const { toast } = require("react-toastify");
    getMyDonations.mockRejectedValueOnce(new Error("network down"));

    render(<MyDonations />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to load your donations.");
    });
  });

  test("shows api error when fulfill update fails", async () => {
    const { toast } = require("react-toastify");
    markFulfilled.mockRejectedValue({
      response: { data: { message: "Donation already fulfilled" } },
    });

    render(<MyDonations />);

    await waitFor(() => {
      expect(screen.getAllByText("School Bags").length).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getByRole("button", { name: /mark as fulfilled/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Donation already fulfilled");
    });
  });

  test("shows empty message for selected tab with no results", async () => {
    getMyDonations.mockResolvedValue({
      data: [
        {
          _id: "fulfilled-only",
          itemName: "Whiteboard Markers",
          quantity: 12,
          status: "Fulfilled",
          schoolId: { name: "Katunayake School" },
        },
      ],
    });

    render(<MyDonations />);

    await waitFor(() => {
      expect(screen.getAllByText("Whiteboard Markers").length).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getByRole("button", { name: /pending/i }));

    await waitFor(() => {
      expect(screen.getByText("No donations in this category yet.")).toBeInTheDocument();
    });
  });
});
