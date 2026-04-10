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

  it('shows success UI and navigates to login on successful registration', async () => {
    const user = userEvent.setup();
    userService.registerDonor.mockResolvedValue({ success: true });
    vi.useFakeTimers();

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

    await waitFor(() => {
      expect(screen.getByText('Registration Successful!')).toBeInTheDocument();
    });

    vi.runAllTimers();
    expect(mockNavigate).toHaveBeenCalledWith('/login');
    vi.useRealTimers();
  });
});