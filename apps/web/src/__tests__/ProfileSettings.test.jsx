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

  // ==========================================
  // NEGATIVE TEST CASES
  // ==========================================

  // NEGATIVE TEST CASE: Client-side validation (Password mismatch)
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

  // NEGATIVE TEST CASE: API Failure on Profile Update
  it('displays an error message if the profile update API fails', async () => {
    const user = userEvent.setup();
    mockUpdateProfile.mockResolvedValue({ success: false, message: 'Failed to update profile.' });

    render(<ProfileSettings />);

    const firstNameInput = screen.getByDisplayValue('Clark');
    await user.clear(firstNameInput);
    await user.type(firstNameInput, 'Bizarro');

    await user.click(screen.getByRole('button', { name: /Save Profile/i }));

    await waitFor(() => {
      expect(screen.getByText('Failed to update profile.')).toBeInTheDocument();
    });
  });

  // NEGATIVE TEST CASE: API Failure on Password Update (e.g., wrong current password)
  it('displays an error message if the password update API fails', async () => {
    const user = userEvent.setup();
    mockUpdatePassword.mockResolvedValue({ success: false, message: 'Incorrect current password.' });

    render(<ProfileSettings />);

    await user.type(screen.getByPlaceholderText('Enter current password'), 'WrongPassword123');
    await user.type(screen.getByPlaceholderText('Enter new password'), 'NewSecurePass!');
    await user.type(screen.getByPlaceholderText('Confirm new password'), 'NewSecurePass!');

    await user.click(screen.getByRole('button', { name: /Update Password/i }));

    await waitFor(() => {
      expect(screen.getByText('Incorrect current password.')).toBeInTheDocument();
    });
  });

  // ==========================================
  // POSITIVE TEST CASES
  // ==========================================

  // POSITIVE TEST CASE: Initial UI Render & Context Data Population
  it('pre-fills the form with the current user data from AuthContext', () => {
    render(<ProfileSettings />);

    // Depending on your UI, it might be a heading or text node
    expect(screen.getByText('Clark Kent')).toBeInTheDocument(); 
    
    // Check input field values
    expect(screen.getByDisplayValue('Clark')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Kent')).toBeInTheDocument();
    expect(screen.getByDisplayValue('clark@dailyplanet.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Metropolis')).toBeInTheDocument();
  });

  // POSITIVE TEST CASE: Successful Profile Update flow
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
      email: 'clark@dailyplanet.com' // Testing that untouched fields remain part of the payload
    }));

    await waitFor(() => {
      expect(screen.getByText('Profile updated successfully!')).toBeInTheDocument();
    });
  });

  // POSITIVE TEST CASE: Successful Password Update flow
  it('successfully updates the password and clears the password fields', async () => {
    const user = userEvent.setup();
    mockUpdatePassword.mockResolvedValue({ success: true, message: 'Password updated successfully!' });

    render(<ProfileSettings />);

    const currentPassInput = screen.getByPlaceholderText('Enter current password');
    const newPassInput = screen.getByPlaceholderText('Enter new password');
    const confirmPassInput = screen.getByPlaceholderText('Confirm new password');

    await user.type(currentPassInput, 'OldPassword123');
    await user.type(newPassInput, 'NewSecurePass!');
    await user.type(confirmPassInput, 'NewSecurePass!');

    await user.click(screen.getByRole('button', { name: /Update Password/i }));

    // FIX: Expecting the object payload
    expect(mockUpdatePassword).toHaveBeenCalledWith({
      currentPassword: 'OldPassword123',
      newPassword: 'NewSecurePass!'
    });

    await waitFor(() => {
      expect(screen.getByText('Password updated successfully!')).toBeInTheDocument();
    });

    // Optionally check if fields are cleared out after success
    expect(currentPassInput).toHaveValue('');
    expect(newPassInput).toHaveValue('');
    expect(confirmPassInput).toHaveValue('');
  });
});