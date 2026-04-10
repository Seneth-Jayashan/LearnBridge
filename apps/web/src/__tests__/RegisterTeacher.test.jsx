import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import RegisterTeacher from '../pages/RegisterTeacher'; 
import userService from '../services/UserService';

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: vi.fn(),
  };
});

vi.mock('../services/UserService', () => ({
  default: {
    registerTeacher: vi.fn(),
    getPublicSchools: vi.fn(),
  }
}));

describe('RegisterTeacher Component', () => {
  const mockNavigate = vi.fn();
  const mockSchools = [
    { _id: 'school1', name: 'Springfield Elementary', address: { city: 'Springfield' } },
    { _id: 'school2', name: 'Shelbyville High', address: { city: 'Shelbyville' } }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    useNavigate.mockReturnValue(mockNavigate);
    userService.getPublicSchools.mockResolvedValue(mockSchools);
  });

  // ==========================================
  // NEGATIVE TEST CASES
  // ==========================================

  // NEGATIVE TEST CASE: Client-side validation (Empty submission)
  it('does not trigger the registration API if required fields are empty', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <RegisterTeacher />
      </MemoryRouter>
    );

    await user.click(screen.getByRole('button', { name: /Complete Registration/i }));
    
    // Assumes form uses standard validation preventing submission of empty inputs
    expect(userService.registerTeacher).not.toHaveBeenCalled();
  });

  // NEGATIVE TEST CASE: API Failure when fetching schools
  it('handles errors gracefully if the fetch schools API call fails', async () => {
    userService.getPublicSchools.mockRejectedValue(new Error('Network Error'));

    render(
      <MemoryRouter>
        <RegisterTeacher />
      </MemoryRouter>
    );

    // Depending on your UI, it might show a generic error message or leave the list empty
    // Adjust this assertion to match your component's specific error handling UI
    await waitFor(() => {
      expect(screen.queryByText('Springfield Elementary - Springfield')).not.toBeInTheDocument();
    });
  });

  // NEGATIVE TEST CASE: Search yields no results
  it('shows no results or empty state when searching for a non-existent school', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <RegisterTeacher />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Springfield Elementary - Springfield')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search school by name...');
    await user.type(searchInput, 'Gotham Academy');

    expect(screen.queryByText('Springfield Elementary - Springfield')).not.toBeInTheDocument();
    expect(screen.queryByText('Shelbyville High - Shelbyville')).not.toBeInTheDocument();
  });

  // NEGATIVE TEST CASE: API Failure during registration
  it('displays an error message if API registration fails', async () => {
    const user = userEvent.setup();
    userService.registerTeacher.mockRejectedValue({
      response: { data: { message: 'Email already registered.' } }
    });

    render(
      <MemoryRouter>
        <RegisterTeacher />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Springfield Elementary - Springfield')).toBeInTheDocument();
    });

    await user.type(screen.getByPlaceholderText('John'), 'Edna');
    await user.type(screen.getByPlaceholderText('Doe'), 'Krabappel');
    await user.type(screen.getByPlaceholderText('teacher@example.com'), 'edna@school.com');
    await user.type(screen.getByPlaceholderText('94771234567'), '94779998888');
    await user.type(screen.getByPlaceholderText('••••••••'), 'TeacherPass1');

    await user.click(screen.getByRole('button', { name: /Complete Registration/i }));

    await waitFor(() => {
      expect(screen.getByText('Email already registered.')).toBeInTheDocument();
    });
  });

  // ==========================================
  // POSITIVE TEST CASES
  // ==========================================

  // POSITIVE TEST CASE: Component Initialization
  it('fetches schools and populates the dropdown on mount', async () => {
    render(
      <MemoryRouter>
        <RegisterTeacher />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Springfield Elementary - Springfield')).toBeInTheDocument();
      expect(screen.getByText('Shelbyville High - Shelbyville')).toBeInTheDocument();
    });
  });

  // POSITIVE TEST CASE: Search and filtering functionality
  it('filters schools based on search input', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <RegisterTeacher />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Springfield Elementary - Springfield')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search school by name...');
    await user.type(searchInput, 'Shelby');

    expect(screen.queryByText('Springfield Elementary - Springfield')).not.toBeInTheDocument();
    expect(screen.getByText('Shelbyville High - Shelbyville')).toBeInTheDocument();
  });

  // POSITIVE TEST CASE: End-to-end registration success
  it('submits successfully and navigates to login', async () => {
    const user = userEvent.setup();
    userService.registerTeacher.mockResolvedValue({ success: true });
    vi.useFakeTimers({ shouldAdvanceTime: true });

    render(
      <MemoryRouter>
        <RegisterTeacher />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Springfield Elementary - Springfield')).toBeInTheDocument();
    });

    await user.type(screen.getByPlaceholderText('John'), 'Edna');
    await user.type(screen.getByPlaceholderText('Doe'), 'Krabappel');
    await user.type(screen.getByPlaceholderText('teacher@example.com'), 'edna@school.com');
    await user.type(screen.getByPlaceholderText('94771234567'), '94779998888');
    await user.type(screen.getByPlaceholderText('••••••••'), 'TeacherPass1');

    await user.click(screen.getByRole('button', { name: /Complete Registration/i }));

    // Ensure API is called (you can update this to check for the specific payload, including the selected school ID)
    expect(userService.registerTeacher).toHaveBeenCalled();

    await waitFor(() => {
      expect(screen.getByText('Registration Received!')).toBeInTheDocument();
    });

    vi.runAllTimers();
    expect(mockNavigate).toHaveBeenCalledWith('/login');
    vi.useRealTimers();
  });
});