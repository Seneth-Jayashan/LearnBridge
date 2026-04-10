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

    await waitFor(() => {
      expect(screen.getByText('Registration Received!')).toBeInTheDocument();
    });

    vi.runAllTimers();
    expect(mockNavigate).toHaveBeenCalledWith('/login');
    vi.useRealTimers();
  });
});