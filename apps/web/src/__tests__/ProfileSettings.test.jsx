import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProfileSettings from '../pages/ProfileSettings'; 
import { useAuth } from '../contexts/AuthContext';
import { useUser } from '../contexts/UserContext';

vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../contexts/UserContext', () => ({
  useUser: vi.fn(),
}));

describe('ProfileSettings Component', () => {
  const mockUpdateProfile = vi.fn();
  const mockUpdatePassword = vi.fn();
  
  const mockUser = {
    firstName: 'Clark',
    lastName: 'Kent',
    email: 'clark@dailyplanet.com',
    phoneNumber: '0771234567',
    address: { street: '1938 Sullivan Ln', city: 'Metropolis', state: 'NY', zip: '10001' }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ user: mockUser });
    useUser.mockReturnValue({
      updateProfile: mockUpdateProfile,
      updatePassword: mockUpdatePassword,
    });
  });

  it('pre-fills the form with the current user data from AuthContext', () => {
    render(<ProfileSettings />);

    expect(screen.getByText('Clark Kent')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Clark')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Kent')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Metropolis')).toBeInTheDocument();
  });

  it('successfully updates profile and displays success message', async () => {
    const user = userEvent.setup();
    mockUpdateProfile.mockResolvedValue({ success: true, message: 'Profile updated successfully!' });

    render(<ProfileSettings />);

    const firstNameInput = screen.getByDisplayValue('Clark');
    await user.clear(firstNameInput);
    await user.type(firstNameInput, 'Superman');

    await user.click(screen.getByRole('button', { name: /Save Profile/i }));

    expect(mockUpdateProfile).toHaveBeenCalledWith(expect.objectContaining({
      firstName: 'Superman',
      lastName: 'Kent',
      email: 'clark@dailyplanet.com'
    }));

    await waitFor(() => {
      expect(screen.getByText('Profile updated successfully!')).toBeInTheDocument();
    });
  });

  it('shows an error if new passwords do not match', async () => {
    const user = userEvent.setup();
    render(<ProfileSettings />);

    await user.type(screen.getByPlaceholderText('Enter current password'), 'OldPassword123');
    await user.type(screen.getByPlaceholderText('Enter new password'), 'NewSecurePass!');
    await user.type(screen.getByPlaceholderText('Confirm new password'), 'DifferentPass!');

    await user.click(screen.getByRole('button', { name: /Update Password/i }));

    expect(mockUpdatePassword).not.toHaveBeenCalled();
    expect(screen.getByText('New passwords do not match.')).toBeInTheDocument();
  });
});