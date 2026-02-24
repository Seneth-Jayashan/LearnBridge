import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// --- Context Providers ---
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { AdminProvider } from "./contexts/AdminContext";
import { SchoolAdminProvider } from "./contexts/SchoolAdminContext";

// --- Layouts & Guards ---
import MainLayout from "./layouts/MainLayout";
import DashboardLayout from "./layouts/DashboardLayout";
import ProtectedRoutes from "./components/ProtectedRoutes";

// --- Public & Shared Pages ---
import Home from "./pages/Home";
import Login from "./pages/Login";
import RegisterDonor from "./pages/RegisterDonor";
import NotFound from "./pages/NotFound";
import Unauthorized from "./pages/Unauthorized";

// --- Role-Specific Route Modules ---
import AdminRoutes from "./routes/AdminRoutes";       // Super Admin
import SchoolAdminRoutes from "./routes/SchoolAdminRoutes"; // School Admin
import TeacherRoutes from "./routes/TeacherRoutes";
import StudentRoutes from "./routes/StudentRoutes";
import DonorRoutes from "./routes/DonorRoutes";

/**
 * Smart Redirect Component:
 * Catches any logged-in user who navigates to "/dashboard" 
 * and routes them to their specific role's dashboard.
 */
const RoleBasedRedirect = () => {
  const { user } = useAuth();
  
  if (!user) return <Navigate to="/login" replace />;
  
  switch (user.role) {
    case "super_admin": return <Navigate to="/admin/dashboard" replace />;
    case "school_admin": return <Navigate to="/school/dashboard" replace />;
    case "teacher": return <Navigate to="/teacher/dashboard" replace />;
    case "student": return <Navigate to="/student/dashboard" replace />;
    case "donor": return <Navigate to="/donor/dashboard" replace />;
    default: return <Navigate to="/unauthorized" replace />;
  }
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AdminProvider>         {/* Wrap for Super Admin State */}
          <SchoolAdminProvider> {/* Wrap for School Admin State */}

            <ToastContainer position="top-right" autoClose={3000} newestOnTop closeOnClick
              pauseOnHover draggable theme="colored"/>
            
            <Routes>
              
              {/* ============================================================== */}
              {/* 1. PUBLIC & SHARED ROUTES (Uses MainLayout + Floating Navbar)  */}
              {/* ============================================================== */}
              <Route element={<MainLayout />}>
                
                {/* Public Pages */}
                <Route path="/" element={<Home />} />            
                <Route path="/login" element={<Login />} />
                <Route path="/register-donor" element={<RegisterDonor />} />
                <Route path="/unauthorized" element={<Unauthorized />} />
                
                {/* Generic Dashboard Route (Smart Router) */}
                <Route element={<ProtectedRoutes />}>
                  <Route path="/dashboard" element={<RoleBasedRedirect />} />
                </Route>

                {/* 404 Catch-All for non-dashboard routes */}
                <Route path="*" element={<NotFound />} />
              </Route>


              {/* ============================================================== */}
              {/* 2. DASHBOARD ROUTES (Uses DashboardLayout + Role Sidebars)     */}
              {/* ============================================================== */}
              <Route element={<DashboardLayout />}>
                  
                  {/* Super Admin Area */}
                  <Route element={<ProtectedRoutes allowedRoles={["super_admin"]} />}>
                    <Route path="/admin/*" element={<AdminRoutes />} />
                  </Route>

                  {/* School Admin Area (NEW) */}
                  <Route element={<ProtectedRoutes allowedRoles={["school_admin"]} />}>
                    <Route path="/school/*" element={<SchoolAdminRoutes />} />
                  </Route>

                  {/* Teacher Area */}
                  <Route element={<ProtectedRoutes allowedRoles={["teacher", "school_admin", "super_admin"]} />}>
                    <Route path="/teacher/*" element={<TeacherRoutes />} />
                  </Route>

                  {/* Student Area */}
                  <Route element={<ProtectedRoutes allowedRoles={["student"]} />}>
                    <Route path="/student/*" element={<StudentRoutes />} />
                  </Route>

                  {/* Donor Area */}
                  <Route element={<ProtectedRoutes allowedRoles={["donor"]} />}>
                    <Route path="/donor/*" element={<DonorRoutes />} />
                  </Route>

              </Route>

            </Routes>

          </SchoolAdminProvider>
        </AdminProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;