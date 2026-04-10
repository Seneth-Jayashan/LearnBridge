import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import RegisterDonor from '../pages/RegisterDonor'; 
import userService from '../services/UserService';

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: vi.fn(),
  };
});

vi.mock('../services/UserService', () => ({
  default: { registerDonor: vi.fn() }
}));

describe('RegisterDonor Component', () => {
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useNavigate.mockReturnValue(mockNavigate);
  });

  // ==========================================
  // NEGATIVE TEST CASES
  // ==========================================

  // NEGATIVE TEST CASE: Client-side validation (Empty submission)
  it('does not trigger the registration API if required fields are empty', async () => {
    const user = userEvent.setup();
    
    render(
      <MemoryRouter>
        <RegisterDonor />
      </MemoryRouter>
    );

    await user.click(screen.getByRole('button', { name: /Complete Registration/i }));
    
    // Assuming the form relies on HTML5 validation or client-side checks to prevent empty submission
    expect(userService.registerDonor).not.toHaveBeenCalled();
  });

  // NEGATIVE TEST CASE: API Failure with specific error message
  it('displays an error message if API registration fails', async () => {
    const user = userEvent.setup();
    userService.registerDonor.mockRejectedValue({
      response: { data: { message: 'Email already exists.' } }
    });

    render(
      <MemoryRouter>
        <RegisterDonor />
      </MemoryRouter>
    );

    await user.type(screen.getByPlaceholderText('John'), 'Clark');
    await user.type(screen.getByPlaceholderText('Doe'), 'Kent');
    await user.type(screen.getByPlaceholderText('john@example.com'), 'clark@test.com');
    await user.type(screen.getByPlaceholderText('94771234567'), '94770000000');
    await user.type(screen.getByPlaceholderText('••••••••'), 'Password123');

    await user.click(screen.getByRole('button', { name: /Complete Registration/i }));

    await waitFor(() => {
      expect(screen.getByText('Email already exists.')).toBeInTheDocument();
    });
  });

  // NEGATIVE TEST CASE: General network/server failure handling
  it('shows a generic error message if the server crashes or network fails', async () => {
    const user = userEvent.setup();
    userService.registerDonor.mockRejectedValue(new Error('Network Error'));

    render(
      <MemoryRouter>
        <RegisterDonor />
      </MemoryRouter>
    );

    await user.type(screen.getByPlaceholderText('John'), 'Error');
    await user.type(screen.getByPlaceholderText('Doe'), 'User');
    await user.type(screen.getByPlaceholderText('john@example.com'), 'error@test.com');
    await user.type(screen.getByPlaceholderText('94771234567'), '94771234567');
    await user.type(screen.getByPlaceholderText('••••••••'), 'Password123');

    await user.click(screen.getByRole('button', { name: /Complete Registration/i }));

    await waitFor(() => {
      // Adjust the expected text to match your component's generic fallback error UI
      expect(screen.getByText(/failed|error|something went wrong/i)).toBeInTheDocument();
    });
  });

  // ==========================================
  // POSITIVE TEST CASES
  // ==========================================

  // POSITIVE TEST CASE: Initial UI Render
  it('renders the registration form correctly', () => {
    render(
      <MemoryRouter>
        <RegisterDonor />
      </MemoryRouter>
    );

    expect(screen.getByText('Create Profile')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('John')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Complete Registration/i })).toBeInTheDocument();
  });

  // POSITIVE TEST CASE: Successful registration flow and navigation
  it('shows success UI and navigates to login on successful registration', async () => {
    const user = userEvent.setup();
    userService.registerDonor.mockResolvedValue({ success: true });
    vi.useFakeTimers({ shouldAdvanceTime: true });

    render(
      <MemoryRouter>
        <RegisterDonor />
      </MemoryRouter>
    );

    await user.type(screen.getByPlaceholderText('John'), 'Bruce');
    await user.type(screen.getByPlaceholderText('Doe'), 'Wayne');
    await user.type(screen.getByPlaceholderText('john@example.com'), 'bruce@test.com');
    await user.type(screen.getByPlaceholderText('94771234567'), '94771112222');
    await user.type(screen.getByPlaceholderText('••••••••'), 'Batman123');

    await user.click(screen.getByRole('button', { name: /Complete Registration/i }));

    // Verify the API was called with the correct payload structure
    expect(userService.registerDonor).toHaveBeenCalledWith(
      expect.objectContaining({
        firstName: 'Bruce',
        lastName: 'Wayne',
        email: 'bruce@test.com',
        phoneNumber: '94771112222',
        password: 'Batman123'
      })
    );

    await waitFor(() => {
      expect(screen.getByText('Registration Successful!')).toBeInTheDocument();
    });

    // Fast-forward timers to trigger navigation
    vi.runAllTimers();
    
    expect(mockNavigate).toHaveBeenCalledWith('/login');
    vi.useRealTimers();
  });
});