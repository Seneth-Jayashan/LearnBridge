import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import ForgotPassword from '../pages/ForgotPassword'; 
import authService from '../services/AuthService';

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: vi.fn(),
  };
});

vi.mock('../services/AuthService', () => ({
  default: { forgotPassword: vi.fn() }
}));

describe('ForgotPassword Component', () => {
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useNavigate.mockReturnValue(mockNavigate);
  });

  // ==========================================
  // NEGATIVE TEST CASES
  // ==========================================

  // NEGATIVE TEST CASE: Client-side validation for empty input
  it('does not call the API if the identifier input is empty', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>
    );

    const submitButton = screen.getByRole('button', { name: /Send Reset Code/i });
    await user.click(submitButton);

    // Ensure API is not triggered when clicking submit with no data
    expect(authService.forgotPassword).not.toHaveBeenCalled();
  });

  // NEGATIVE TEST CASE: API Failure with specific error message
  it('shows error if API call fails with user not found', async () => {
    const user = userEvent.setup();
    authService.forgotPassword.mockRejectedValue({
      response: { data: { message: 'User not found.' } }
    });

    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>
    );

    await user.type(screen.getByPlaceholderText('Enter your identifier'), 'wrong@email.com');
    await user.click(screen.getByRole('button', { name: /Send Reset Code/i }));

    await waitFor(() => {
      expect(screen.getByText('User not found.')).toBeInTheDocument();
    });
  });

  // NEGATIVE TEST CASE: General network/server failure handling
  it('shows a generic error message if the server crashes or network fails', async () => {
    const user = userEvent.setup();
    authService.forgotPassword.mockRejectedValue(new Error('Network Error'));

    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>
    );

    await user.type(screen.getByPlaceholderText('Enter your identifier'), 'error@email.com');
    await user.click(screen.getByRole('button', { name: /Send Reset Code/i }));

    await waitFor(() => {
      // Adjust the expected text to match your component's generic fallback error UI
      expect(screen.getByText(/failed|error|something went wrong/i)).toBeInTheDocument();
    });
  });

  // ==========================================
  // POSITIVE TEST CASES
  // ==========================================

  // POSITIVE TEST CASE: Initial UI Render
  it('renders the forgot password form elements correctly on load', () => {
    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>
    );

    expect(screen.getByPlaceholderText('Enter your identifier')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Send Reset Code/i })).toBeInTheDocument();
  });

  // POSITIVE TEST CASE: Successful API call and subsequent navigation
  it('navigates to reset-password with state on successful API response', async () => {
    const user = userEvent.setup();
    authService.forgotPassword.mockResolvedValue({ success: true });

    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>
    );

    await user.type(screen.getByPlaceholderText('Enter your identifier'), 'correct@email.com');
    await user.click(screen.getByRole('button', { name: /Send Reset Code/i }));

    // Ensure the API was called with the correct payload
    expect(authService.forgotPassword).toHaveBeenCalledWith('correct@email.com');

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/reset-password', {
        state: { identifier: 'correct@email.com' }
      });
    });
  });
});