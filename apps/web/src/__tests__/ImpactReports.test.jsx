import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import ImpactReports from "../pages/Donor/ImpactReports";
import { getImpactReport } from "../services/donorServices";

jest.mock("react-toastify", () => ({
  toast: { error: jest.fn() },
}));

jest.mock("../services/donorServices");

const mockReport = {
  totalItemsDonated: 100,
  totalSchoolsSupported: 5,
  mostDonatedItem: "Notebooks",
  log: [
    {
      item: "Notebooks",
      quantity: 10,
      school: "ABC School",
      date: new Date().toISOString(),
    },
    {
      item: "Pens",
      quantity: 5,
      school: "XYZ School",
      date: new Date().toISOString(),
    },
  ],
};

describe("ImpactReports Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getImpactReport.mockResolvedValue({ data: mockReport });
  });

  // ─────────────────────────────────────────
  // POSITIVE TEST CASES
  // ─────────────────────────────────────────
  describe("Positive Tests", () => {
    test("renders impact report header", async () => {
      render(<ImpactReports />);
      await waitFor(() => {
        expect(screen.getByText("Impact Reports")).toBeInTheDocument();
      });
    });

    test("renders summary cards", async () => {
      render(<ImpactReports />);
      await waitFor(() => {
        expect(screen.getByText("Total Items Donated")).toBeInTheDocument();
        expect(screen.getByText("Schools Supported")).toBeInTheDocument();
        expect(screen.getByText("Most Donated Item")).toBeInTheDocument();
      });
    });

    test("toggles this month filter", async () => {
      render(<ImpactReports />);
      await waitFor(() => screen.getByText("Transparency Log"));

      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(screen.getByText(/this month only/i)).toBeInTheDocument();
      });
    });
  });

  // ─────────────────────────────────────────
  // NEGATIVE TEST CASES
  // ─────────────────────────────────────────
  describe("Negative Tests", () => {
    test("renders loading spinner initially", () => {
      getImpactReport.mockImplementation(() => new Promise(() => {}));

      render(<ImpactReports />);

      expect(document.querySelector(".animate-spin")).toBeTruthy();
    });

    test("shows empty log state", async () => {
      getImpactReport.mockResolvedValue({
        data: { ...mockReport, log: [] },
      });

      render(<ImpactReports />);

      await waitFor(() => {
        expect(
          screen.getByText(/No fulfilled donations yet/i)
        ).toBeInTheDocument();
      });
    });

    test("handles API error", async () => {
      const { toast } = require("react-toastify");

      getImpactReport.mockRejectedValue(new Error("fail"));

      render(<ImpactReports />);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          "Failed to load impact report."
        );
      });
    });
  });
});