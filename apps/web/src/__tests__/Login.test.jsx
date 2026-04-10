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

  // ==========================================
  // NEGATIVE TEST CASES
  // ==========================================

  // NEGATIVE TEST CASE: Renders context-level authentication errors
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

  // NEGATIVE TEST CASE: Client-side validation (Empty submission)
  it('does not trigger the login API if required fields are empty', async () => {
    const user = userEvent.setup();
    
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    // Assuming the form has some basic HTML5 validation or client-side checks that prevent empty submission
    await user.click(screen.getByRole('button', { name: /Authorize Account/i }));
    
    expect(mockLogin).not.toHaveBeenCalled();
  });


  // ==========================================
  // POSITIVE TEST CASES
  // ==========================================

  // POSITIVE TEST CASE: Initial UI Render
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

  // POSITIVE TEST CASE: UI state change during loading
  it('disables the submit button while authentication is in progress (loading state)', () => {
    useAuth.mockReturnValue({
      login: mockLogin,
      loading: true, 
      error: null,
    });

    const { container } = render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    // Grab the submit button directly since the inner text is removed during loading
    const submitButton = container.querySelector('button[type="submit"]');
    expect(submitButton).toBeDisabled();
  });

  // POSITIVE TEST CASE: Standard authentication flow
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

  // POSITIVE TEST CASE: Edge-case authentication flow (First-time user setup)
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