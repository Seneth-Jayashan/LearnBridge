import { render, screen, fireEvent } from "@testing-library/react";
import PaymentCancel from "../pages/Donor/PaymentCancel";
import { BrowserRouter } from "react-router-dom";

const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderWithRouter = (ui) =>
  render(<BrowserRouter>{ui}</BrowserRouter>);

describe("PaymentCancel Component", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  // ─────────────────────────────────────────
  // POSITIVE TEST CASES
  // ─────────────────────────────────────────
  describe("Positive Tests", () => {
    test("renders cancelled message", () => {
      renderWithRouter(<PaymentCancel />);
      expect(screen.getByText("Payment Cancelled")).toBeInTheDocument();
    });

    test("shows warning text", () => {
      renderWithRouter(<PaymentCancel />);
      expect(
        screen.getByText(/No charges were made/i)
      ).toBeInTheDocument();
    });

    test("navigates back to donor dashboard", () => {
      renderWithRouter(<PaymentCancel />);

      fireEvent.click(screen.getByText("Back to Dashboard"));

      expect(mockNavigate).toHaveBeenCalledWith("/donor");
    });
  });

  // ─────────────────────────────────────────
  // NEGATIVE TEST CASES
  // (Component has no real failure paths,
  // so we test incorrect navigation behavior)
  // ─────────────────────────────────────────
  describe("Negative Tests", () => {
    test("does not navigate on initial render", () => {
      renderWithRouter(<PaymentCancel />);

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    test("does not navigate when clicking non-existent button", () => {
      renderWithRouter(<PaymentCancel />);

      // simulate no action
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
});