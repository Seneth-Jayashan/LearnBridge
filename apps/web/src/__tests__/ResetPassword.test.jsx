import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useNavigate, useLocation } from 'react-router-dom';
import ResetPassword from '../pages/ResetPassword'; 
import authService from '../services/AuthService';

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: vi.fn(),
    useLocation: vi.fn(),
  };
});

vi.mock('../services/AuthService', () => ({
  default: { resetPassword: vi.fn() }
}));

describe('ResetPassword Component', () => {
  const mockNavigate = vi.fn();
  let mockLocationState = { identifier: 'test@user.com' };

  beforeEach(() => {
    vi.clearAllMocks();
    useNavigate.mockReturnValue(mockNavigate);
    useLocation.mockReturnValue({ state: mockLocationState });
  });

  // ==========================================
  // NEGATIVE TEST CASES
  // ==========================================

  // NEGATIVE TEST CASE: Missing required routing state
  it('redirects to forgot-password if no identifier is in state', async () => {
    useLocation.mockReturnValue({ state: null });

    render(
      <MemoryRouter>
        <ResetPassword />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/forgot-password');
    });
  });

  // NEGATIVE TEST CASE: Client-side validation (Empty submission)
  it('does not trigger the reset API if required fields are empty', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ResetPassword />
      </MemoryRouter>
    );

    await user.click(screen.getByRole('button', { name: /Reset Password/i }));

    // Assuming HTML5 validation or internal checks prevent submission
    expect(authService.resetPassword).not.toHaveBeenCalled();
  });

  // NEGATIVE TEST CASE: Client-side validation (Password mismatch)
  it('shows error if passwords do not match without hitting API', async () => {
    const user = userEvent.setup();
    
    render(
      <MemoryRouter>
        <ResetPassword />
      </MemoryRouter>
    );

    const passwordInputs = screen.getAllByPlaceholderText('••••••••');
    
    await user.type(screen.getByPlaceholderText('123456'), '999999'); 
    await user.type(passwordInputs[0], 'NewPass123!'); 
    await user.type(passwordInputs[1], 'MismatchPass!'); 

    await user.click(screen.getByRole('button', { name: /Reset Password/i }));

    expect(authService.resetPassword).not.toHaveBeenCalled();
    expect(screen.getByText('Passwords do not match.')).toBeInTheDocument();
  });

  // NEGATIVE TEST CASE: API Failure (e.g., Invalid or expired OTP/Token)
  it('displays an error message if the API reset call fails', async () => {
    const user = userEvent.setup();
    authService.resetPassword.mockRejectedValue({
      response: { data: { message: 'Invalid or expired reset token.' } }
    });

    render(
      <MemoryRouter>
        <ResetPassword />
      </MemoryRouter>
    );

    const passwordInputs = screen.getAllByPlaceholderText('••••••••');
    
    await user.type(screen.getByPlaceholderText('123456'), '000000'); 
    await user.type(passwordInputs[0], 'ValidPass123!'); 
    await user.type(passwordInputs[1], 'ValidPass123!'); 

    await user.click(screen.getByRole('button', { name: /Reset Password/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid or expired reset token.')).toBeInTheDocument();
    });
  });

  // NEGATIVE TEST CASE: General network/server failure handling
  it('shows a generic error message if the server crashes or network fails', async () => {
    const user = userEvent.setup();
    authService.resetPassword.mockRejectedValue(new Error('Network Error'));

    render(
      <MemoryRouter>
        <ResetPassword />
      </MemoryRouter>
    );

    const passwordInputs = screen.getAllByPlaceholderText('••••••••');
    
    await user.type(screen.getByPlaceholderText('123456'), '111111'); 
    await user.type(passwordInputs[0], 'NetworkPass1!'); 
    await user.type(passwordInputs[1], 'NetworkPass1!'); 

    await user.click(screen.getByRole('button', { name: /Reset Password/i }));

    await waitFor(() => {
      expect(screen.getByText(/failed|error|something went wrong/i)).toBeInTheDocument();
    });
  });

  // ==========================================
  // POSITIVE TEST CASES
  // ==========================================

  // POSITIVE TEST CASE: Initial UI Render
  it('renders the reset password form correctly on load', () => {
    render(
      <MemoryRouter>
        <ResetPassword />
      </MemoryRouter>
    );

    expect(screen.getByPlaceholderText('123456')).toBeInTheDocument();
    expect(screen.getAllByPlaceholderText('••••••••')).toHaveLength(2);
    expect(screen.getByRole('button', { name: /Reset Password/i })).toBeInTheDocument();
  });

  // POSITIVE TEST CASE: Successful API call and navigation
  it('calls API and navigates to login on success', async () => {
    const user = userEvent.setup();
    authService.resetPassword.mockResolvedValue({ success: true });
    vi.useFakeTimers({ shouldAdvanceTime: true });

    render(
      <MemoryRouter>
        <ResetPassword />
      </MemoryRouter>
    );

    const passwordInputs = screen.getAllByPlaceholderText('••••••••');
    
    await user.type(screen.getByPlaceholderText('123456'), '555555'); 
    await user.type(passwordInputs[0], 'PerfectMatch1!'); 
    await user.type(passwordInputs[1], 'PerfectMatch1!'); 

    await user.click(screen.getByRole('button', { name: /Reset Password/i }));

    expect(authService.resetPassword).toHaveBeenCalledWith('test@user.com', '555555', 'PerfectMatch1!');

    await waitFor(() => {
      expect(screen.getByText('Password reset successfully! Redirecting to login...')).toBeInTheDocument();
    });

    vi.runAllTimers();
    expect(mockNavigate).toHaveBeenCalledWith('/login');
    vi.useRealTimers();
  });
});