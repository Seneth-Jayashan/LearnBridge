import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import Login from '../pages/Login'; 
import { useAuth } from '../contexts/AuthContext';

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: vi.fn(),
    useLocation: vi.fn(() => ({ state: null })),
  };
});

vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('Login Component', () => {
  const mockLogin = vi.fn();
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useNavigate.mockReturnValue(mockNavigate);
    useAuth.mockReturnValue({
      login: mockLogin,
      loading: false,
      error: null,
    });
  });

  it('renders the login form correctly', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email, Phone or Student ID')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Authorize Account/i })).toBeInTheDocument();
  });

  it('displays an error message if auth context has an error', () => {
    useAuth.mockReturnValue({
      login: mockLogin,
      loading: false,
      error: 'Invalid credentials provided.',
    });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    expect(screen.getByText('Invalid credentials provided.')).toBeInTheDocument();
  });

  it('submits the form and navigates to dashboard on standard success', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue({ success: true, requiresOtpVerification: false });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    await user.type(screen.getByPlaceholderText('Email, Phone or Student ID'), 'teacher@school.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'Password123');
    await user.click(screen.getByRole('button', { name: /Authorize Account/i }));

    expect(mockLogin).toHaveBeenCalledWith('teacher@school.com', 'Password123');

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
    });
  });

  it('navigates to OTP verification if first login is detected', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue({ 
      success: true, 
      requiresOtpVerification: true, 
      userId: '12345', 
      message: 'First login detected' 
    });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    await user.type(screen.getByPlaceholderText('Email, Phone or Student ID'), 'newuser@school.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'TempPass1!');
    await user.click(screen.getByRole('button', { name: /Authorize Account/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/first-login-verification', {
        replace: true,
        state: { userId: '12345', message: 'First login detected' }
      });
    });
  });
});