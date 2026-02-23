import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// --- Context Providers ---
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { UserProvider } from "./contexts/UserContext";
import { AdminProvider } from "./contexts/AdminContext";
import { SchoolAdminProvider } from "./contexts/SchoolAdminContext";

// --- Layouts & Guards ---
import MainLayout from "./layouts/MainLayout";
import DashboardLayout from "./layouts/DashboardLayout";
import ProtectedRoutes from "./components/ProtectedRoutes";

// --- Pages ---
import Home from "./pages/Home";
import Login from "./pages/Login";
import RegisterDonor from "./pages/RegisterDonor";
import RegisterTeacher from "./pages/RegisterTeacher"; // Added
import NotFound from "./pages/NotFound";
import Unauthorized from "./pages/Unauthorized";

// --- Role Routes ---
import AdminRoutes from "./routes/AdminRoutes"; 
import SchoolAdminRoutes from "./routes/SchoolAdminRoutes";
import TeacherRoutes from "./routes/TeacherRoutes";
import StudentRoutes from "./routes/StudentRoutes";
import DonorRoutes from "./routes/DonorRoutes";

const RoleBasedRedirect = () => {
  const { user, isSuperAdmin, isSchoolAdmin, isTeacher, isStudent, isDonor } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  
  if (isSuperAdmin) return <Navigate to="/admin/dashboard" replace />;
  if (isSchoolAdmin) return <Navigate to="/school/dashboard" replace />;
  if (isTeacher) return <Navigate to="/teacher/dashboard" replace />;
  if (isStudent) return <Navigate to="/student/dashboard" replace />;
  if (isDonor) return <Navigate to="/donor/dashboard" replace />;
  
  return <Navigate to="/unauthorized" replace />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <UserProvider>
          <AdminProvider>
            <SchoolAdminProvider>
              <Routes>
                
                {/* 1. PUBLIC ROUTES */}
                <Route element={<MainLayout />}>
                  <Route path="/" element={<Home />} />            
                  <Route path="/login" element={<Login />} />
                  <Route path="/register-donor" element={<RegisterDonor />} />
                  <Route path="/register-teacher" element={<RegisterTeacher />} />
                  <Route path="/unauthorized" element={<Unauthorized />} />
                  
                  <Route element={<ProtectedRoutes />}>
                    <Route path="/dashboard" element={<RoleBasedRedirect />} />
                  </Route>

                  <Route path="*" element={<NotFound />} />
                </Route>

                {/* 2. PROTECTED DASHBOARDS */}
                <Route element={<DashboardLayout />}>
                  
                  <Route element={<ProtectedRoutes allowedRoles={["super_admin"]} />}>
                    <Route path="/admin/*" element={<AdminRoutes />} />
                  </Route>

                  <Route element={<ProtectedRoutes allowedRoles={["school_admin"]} />}>
                    <Route path="/school/*" element={<SchoolAdminRoutes />} />
                  </Route>

                  <Route element={<ProtectedRoutes allowedRoles={["teacher", "school_admin", "super_admin"]} />}>
                    <Route path="/teacher/*" element={<TeacherRoutes />} />
                  </Route>

                  <Route element={<ProtectedRoutes allowedRoles={["student"]} />}>
                    <Route path="/student/*" element={<StudentRoutes />} />
                  </Route>

                  <Route element={<ProtectedRoutes allowedRoles={["donor"]} />}>
                    <Route path="/donor/*" element={<DonorRoutes />} />
                  </Route>

                </Route>
              </Routes>
            </SchoolAdminProvider>
          </AdminProvider>
        </UserProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;