import { render, screen, fireEvent } from "@testing-library/react";
import PaymentSuccess from "../pages/donor/PaymentSuccess";
import PaymentCancel from "../pages/donor/PaymentCancel";

const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

describe("Donor Payment Status Pages", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders payment success page content", () => {
    render(<PaymentSuccess />);

    expect(screen.getByText("Payment Successful!")).toBeInTheDocument();
    expect(
      screen.getByText("Thank you for supporting this school ❤️")
    ).toBeInTheDocument();
  });

  test("redirects donor dashboard after timeout on success page", () => {
    jest.useFakeTimers();

    render(<PaymentSuccess />);
    jest.advanceTimersByTime(3000);

    expect(mockNavigate).toHaveBeenCalledWith("/donor");

    jest.useRealTimers();
  });

  test("renders payment cancelled page and navigates on button click", () => {
    render(<PaymentCancel />);

    expect(screen.getByText("Payment Cancelled")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /back to dashboard/i }));
    expect(mockNavigate).toHaveBeenCalledWith("/donor");
  });
});
