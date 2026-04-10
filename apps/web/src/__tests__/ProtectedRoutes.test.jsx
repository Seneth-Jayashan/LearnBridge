import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoutes from '../components/ProtectedRoutes';
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

  // ==========================================
  // NEGATIVE TEST CASES
  // ==========================================

  // NEGATIVE TEST CASE: Unauthenticated user
  it('redirects to /login if there is no user logged in', () => {
    useAuth.mockReturnValue({ loading: false, user: null });
    renderWithRouter('/dashboard');
    
    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Secure Dashboard')).not.toBeInTheDocument();
  });

  // NEGATIVE TEST CASE: Authenticated but unauthorized (wrong role)
  it('redirects to /unauthorized if the user has a role that is not allowed', () => {
    useAuth.mockReturnValue({ 
      loading: false, 
      user: { role: 'student' } 
    });
    
    renderWithRouter('/dashboard');
    
    expect(screen.getByText('Unauthorized Page')).toBeInTheDocument();
    expect(screen.queryByText('Secure Dashboard')).not.toBeInTheDocument();
  });

  // NEGATIVE TEST CASE: Authenticated but missing role property entirely
  it('redirects to /unauthorized if the user object lacks a defined role', () => {
    useAuth.mockReturnValue({ 
      loading: false, 
      user: { name: 'Incomplete User' } // Missing 'role'
    });
    
    renderWithRouter('/dashboard');
    
    expect(screen.getByText('Unauthorized Page')).toBeInTheDocument();
  });


  // ==========================================
  // POSITIVE & STATE TEST CASES
  // ==========================================

  // POSITIVE TEST CASE: Renders loading state properly
  it('shows a loading spinner when auth state is loading', () => {
    useAuth.mockReturnValue({ loading: true, user: null });
    renderWithRouter('/dashboard');
    
    expect(screen.getByText('Loading session...')).toBeInTheDocument();
  });

  // POSITIVE TEST CASE: Authorized access (Primary Role)
  it('renders the protected component if user is logged in with the school_admin role', () => {
    useAuth.mockReturnValue({ 
      loading: false, 
      user: { role: 'school_admin' } 
    });
    
    renderWithRouter('/dashboard');
    
    expect(screen.getByText('Secure Dashboard')).toBeInTheDocument();
  });

  // POSITIVE TEST CASE: Authorized access (Secondary Role)
  it('renders the protected component if user is logged in with the teacher role', () => {
    useAuth.mockReturnValue({ 
      loading: false, 
      user: { role: 'teacher' } 
    });
    
    renderWithRouter('/dashboard');
    
    expect(screen.getByText('Secure Dashboard')).toBeInTheDocument();
  });
});