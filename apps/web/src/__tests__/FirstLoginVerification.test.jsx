import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import FirstLoginVerification from '../pages/FirstLoginVerification'; 
import { useAuth } from '../contexts/AuthContext';

vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

const mockNavigate = vi.fn();
let mockLocationState = { userId: '12345', message: 'OTP sent to your email and phone.' };

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: mockLocationState }),
  };
});

describe('FirstLoginVerification Component', () => {
  const mockVerifyOtp = vi.fn();
  const mockCompleteLogin = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockLocationState = { userId: '12345', message: 'OTP sent to your email and phone.' };
    useAuth.mockReturnValue({
      verifyFirstLoginOtp: mockVerifyOtp,
      completeFirstLogin: mockCompleteLogin,
    });
  });

  // ==========================================
  // NEGATIVE TEST CASES
  // ==========================================

  it('redirects to /login if accessed without a userId in location state', async () => {
    mockLocationState = null;

    render(
      <MemoryRouter>
        <FirstLoginVerification />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
    });
  });

  it('displays an error message if OTP verification fails', async () => {
    const user = userEvent.setup();
    mockVerifyOtp.mockResolvedValue({ success: false, message: 'Invalid OTP code.' });

    render(
      <MemoryRouter>
        <FirstLoginVerification />
      </MemoryRouter>
    );

    await user.type(screen.getByPlaceholderText('Enter 6-digit OTP'), '123456');
    await user.click(screen.getByRole('button', { name: /Verify Code/i }));

    expect(mockVerifyOtp).toHaveBeenCalledWith('12345', '123456');
    
    await waitFor(() => {
      expect(screen.getByText('Invalid OTP code.')).toBeInTheDocument();
    });
  });

  it('shows an error if new passwords do not match in Step 2', async () => {
    const user = userEvent.setup();
    mockVerifyOtp.mockResolvedValue({ success: true, resetToken: 'token' });

    render(
      <MemoryRouter>
        <FirstLoginVerification />
      </MemoryRouter>
    );

    await user.type(screen.getByPlaceholderText('Enter 6-digit OTP'), '111111');
    await user.click(screen.getByRole('button', { name: /Verify Code/i }));

    await waitFor(() => {
      expect(screen.getByText('Secure Account')).toBeInTheDocument();
    });

    const passwordInputs = screen.getAllByPlaceholderText('••••••••');
    await user.type(passwordInputs[0], 'SecurePass123!');
    await user.type(passwordInputs[1], 'WrongPass123!');
    await user.click(screen.getByRole('button', { name: /Save & Login/i }));

    expect(mockCompleteLogin).not.toHaveBeenCalled();
    expect(screen.getByText('Passwords do not match.')).toBeInTheDocument();
  });

  it('displays an error message if the final completeLogin API call fails in Step 2', async () => {
    const user = userEvent.setup();
    mockVerifyOtp.mockResolvedValue({ success: true, resetToken: 'valid-reset-token' });
    mockCompleteLogin.mockResolvedValue({ success: false, message: 'Server rejected password.' });

    render(
      <MemoryRouter>
        <FirstLoginVerification />
      </MemoryRouter>
    );

    // Pass Step 1
    await user.type(screen.getByPlaceholderText('Enter 6-digit OTP'), '999999');
    await user.click(screen.getByRole('button', { name: /Verify Code/i }));

    await waitFor(() => {
      expect(screen.getByText('Secure Account')).toBeInTheDocument();
    });

    // Fail Step 2 via API (Using a string >= 8 chars to pass client validation)
    const passwordInputs = screen.getAllByPlaceholderText('••••••••');
    await user.type(passwordInputs[0], 'ValidPass123!');
    await user.type(passwordInputs[1], 'ValidPass123!');
    await user.click(screen.getByRole('button', { name: /Save & Login/i }));

    await waitFor(() => {
      expect(screen.getByText('Server rejected password.')).toBeInTheDocument();
    });
    expect(mockNavigate).not.toHaveBeenCalledWith('/dashboard', expect.anything());
  });

  // ==========================================
  // POSITIVE TEST CASES
  // ==========================================

  it('renders Step 1 (OTP form) correctly with the success message from Login', () => {
    render(
      <MemoryRouter>
        <FirstLoginVerification />
      </MemoryRouter>
    );

    expect(screen.getByText('Verify Identity')).toBeInTheDocument();
    expect(screen.getByText('OTP sent to your email and phone.')).toBeInTheDocument();
  });

  it('transitions to Step 2 (Password Setup) on successful OTP verification', async () => {
    const user = userEvent.setup();
    mockVerifyOtp.mockResolvedValue({ 
      success: true, 
      resetToken: 'fake-jwt-token', 
      message: 'OTP verified successfully.' 
    });

    render(
      <MemoryRouter>
        <FirstLoginVerification />
      </MemoryRouter>
    );

    await user.type(screen.getByPlaceholderText('Enter 6-digit OTP'), '654321');
    await user.click(screen.getByRole('button', { name: /Verify Code/i }));

    await waitFor(() => {
      expect(screen.getByText('Secure Account')).toBeInTheDocument();
    });

    expect(screen.getByText('OTP verified successfully.')).toBeInTheDocument();
    expect(screen.getAllByPlaceholderText('••••••••')[0]).toBeInTheDocument(); 
  });

  it('successfully completes password setup and navigates to dashboard', async () => {
    const user = userEvent.setup();
    mockVerifyOtp.mockResolvedValue({ success: true, resetToken: 'valid-reset-token' });
    mockCompleteLogin.mockResolvedValue({ success: true });

    render(
      <MemoryRouter>
        <FirstLoginVerification />
      </MemoryRouter>
    );

    // Pass Step 1
    await user.type(screen.getByPlaceholderText('Enter 6-digit OTP'), '999999');
    await user.click(screen.getByRole('button', { name: /Verify Code/i }));

    await waitFor(() => {
      expect(screen.getByText('Secure Account')).toBeInTheDocument();
    });

    // Pass Step 2
    const passwordInputs = screen.getAllByPlaceholderText('••••••••');
    await user.type(passwordInputs[0], 'PerfectPassword1!');
    await user.type(passwordInputs[1], 'PerfectPassword1!');
    await user.click(screen.getByRole('button', { name: /Save & Login/i }));

    expect(mockCompleteLogin).toHaveBeenCalledWith('valid-reset-token', 'PerfectPassword1!');

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
    });
  });
});