import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoutes from '../routes/ProtectedRoutes'; // Check path!
import { useAuth } from '../contexts/AuthContext';

vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('ProtectedRoutes Component', () => {
  const renderWithRouter = (initialRoute = '/') => {
    return render(
      <MemoryRouter initialEntries={[initialRoute]}>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route path="/unauthorized" element={<div>Unauthorized Page</div>} />
          <Route element={<ProtectedRoutes allowedRoles={['school_admin', 'teacher']} />}>
            <Route path="/dashboard" element={<div>Secure Dashboard</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );
  };

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('shows a loading spinner when auth state is loading', () => {
    useAuth.mockReturnValue({ loading: true, user: null });
    renderWithRouter('/dashboard');
    
    expect(screen.getByText('Loading session...')).toBeInTheDocument();
  });

  it('redirects to /login if there is no user logged in', () => {
    useAuth.mockReturnValue({ loading: false, user: null });
    renderWithRouter('/dashboard');
    
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('redirects to /unauthorized if the user has the wrong role', () => {
    useAuth.mockReturnValue({ 
      loading: false, 
      user: { role: 'student' } 
    });
    
    renderWithRouter('/dashboard');
    
    expect(screen.getByText('Unauthorized Page')).toBeInTheDocument();
  });

  it('renders the protected component if user is logged in with the correct role', () => {
    useAuth.mockReturnValue({ 
      loading: false, 
      user: { role: 'school_admin' } 
    });
    
    renderWithRouter('/dashboard');
    
    expect(screen.getByText('Secure Dashboard')).toBeInTheDocument();
  });
});