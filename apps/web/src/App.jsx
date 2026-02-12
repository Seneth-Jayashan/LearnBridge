import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";

// Components
import Navbar from "./components/Navbar";
import ProtectedRoutes from "./components/ProtectedRoutes";

// Pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import RegisterDonor from "./pages/RegisterDonor";
import Dashboard from "./pages/admin/Dashboard";
import AdminPanel from "./pages/admin/AdminPanel";
import NotFound from "./pages/NotFound";
import Unauthorized from "./pages/Unauthorized";

// Helper component to add padding for the floating navbar
// Only adds padding if Navbar is visible (not on login/register)
const PageLayout = ({ children }) => {
  const location = useLocation();
  const isAuthPage = ["/login", "/register-donor"].includes(location.pathname);
  
  return (
    <div className={!isAuthPage ? "pt-28 px-4" : ""}>
      {children}
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Navbar /> {/* Floating Navbar stays on top */}
        
        <PageLayout>
          <Routes>
            {/* --- Public Routes --- */}
            <Route path="/" element={<Home />} />            
            <Route path="/login" element={<Login />} />
            <Route path="/register-donor" element={<RegisterDonor />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* --- Protected Routes --- */}
            <Route element={<ProtectedRoutes />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<div>Profile Page</div>} />
            </Route>

            {/* --- Admin Only --- */}
            <Route element={<ProtectedRoutes allowedRoles={["admin"]} />}>
              <Route path="/admin" element={<AdminPanel />} />
              {/* Add other admin routes here */}
            </Route>

            {/* --- Teacher Only --- */}
            <Route element={<ProtectedRoutes allowedRoles={["teacher", "admin"]} />}>
              <Route path="/grades" element={<div>Grade Management</div>} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </PageLayout>
        
      </AuthProvider>
    </Router>
  );
}

export default App;