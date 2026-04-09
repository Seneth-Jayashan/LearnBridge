import { render, screen } from "@testing-library/react";
import PaymentSuccess from "../pages/Donor/PaymentSuccess";
import { BrowserRouter } from "react-router-dom";

const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

jest.useFakeTimers();

const renderWithRouter = (ui) =>
  render(<BrowserRouter>{ui}</BrowserRouter>);

describe("PaymentSuccess Component", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    jest.clearAllTimers();
  });

  // ─────────────────────────────────────────
  // POSITIVE TEST CASES
  // ─────────────────────────────────────────
  describe("Positive Tests", () => {
    test("renders success message", () => {
      renderWithRouter(<PaymentSuccess />);
      expect(screen.getByText("Payment Successful!")).toBeInTheDocument();
    });

    test("shows thank you message", () => {
      renderWithRouter(<PaymentSuccess />);
      expect(
        screen.getByText(/Thank you for supporting this school/i)
      ).toBeInTheDocument();
    });

    test("redirects after timeout", () => {
      renderWithRouter(<PaymentSuccess />);

      jest.advanceTimersByTime(3000);

      expect(mockNavigate).toHaveBeenCalledWith("/donor");
    });
  });

  // ─────────────────────────────────────────
  // NEGATIVE TEST CASES
  // ─────────────────────────────────────────
  describe("Negative Tests", () => {
    test("does not navigate immediately on render", () => {
      renderWithRouter(<PaymentSuccess />);
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    test("does not navigate before timeout", () => {
      renderWithRouter(<PaymentSuccess />);

      jest.advanceTimersByTime(2000);

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    test("does not crash without timer trigger", () => {
      renderWithRouter(<PaymentSuccess />);
      expect(screen.getByText("Payment Successful!")).toBeInTheDocument();
    });
  });
});