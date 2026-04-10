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

  it('shows error if API call fails', async () => {
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

  it('navigates to reset-password with state on success', async () => {
    const user = userEvent.setup();
    authService.forgotPassword.mockResolvedValue({ success: true });

    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>
    );

    await user.type(screen.getByPlaceholderText('Enter your identifier'), 'correct@email.com');
    await user.click(screen.getByRole('button', { name: /Send Reset Code/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/reset-password', {
        state: { identifier: 'correct@email.com' }
      });
    });
  });
});