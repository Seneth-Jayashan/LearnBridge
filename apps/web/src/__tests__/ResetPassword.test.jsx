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

  it('calls API and navigates to login on success', async () => {
    const user = userEvent.setup();
    authService.resetPassword.mockResolvedValue({ success: true });
    vi.useFakeTimers();

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