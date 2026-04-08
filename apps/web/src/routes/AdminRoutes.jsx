import { useOutletContext, Routes, Route, Navigate } from "react-router-dom";
import AdminSidebar from "../components/sidebar/AdminSidebar";
import Users from "../pages/admin/users/Users";
import CreateUser from "../pages/admin/users/Create";
import Update from "../pages/admin/users/Update";
import Schools from "../pages/admin/schools/Schools";
import CreateSchool from "../pages/admin/schools/Create";
import EditSchool from "../pages/admin/schools/Update";
import ModulesManage from "../pages/admin/Modules/ModulesManage";
import AddModules from "../pages/admin/Modules/AddModules";
import EditModules from "../pages/admin/Modules/EditModules";
import LevelManage from "../pages/admin/Levels/LevelManage";
import AddLevels from "../pages/admin/Levels/AddLevels";
import EditLevels from "../pages/admin/Levels/EditLevels";
import GradeManage from "../pages/admin/Grades/GradeManage";
import AddGrade from "../pages/admin/Grades/AddGrade";
import EditGrade from "../pages/admin/Grades/EditGrade";
import ProfileSettings from "../pages/ProfileSettings";

const AdminRoutes = () => {
  // ✅ FIX 1: Pull isExpanded directly from the Outlet context
  const { 
    isMobileMenuOpen, 
    setIsMobileMenuOpen, 
    isExpanded, 
    setIsExpanded 
  } = useOutletContext();

  return (
    <>
      <AdminSidebar 
        isOpen={isMobileMenuOpen} 
        close={() => setIsMobileMenuOpen(false)} 
        isExpanded={isExpanded}
        setIsExpanded={setIsExpanded}
      />
      
      <div className="w-full transition-all duration-300">
        <Routes>
          <Route path="dashboard" element={<div>admin Dashboard Content</div>} />
          
          {/* User Routes */}
          <Route path="users" element={<Users />} />
          <Route path="users/create" element={<CreateUser />} />
          <Route path="users/edit/:id" element={<Update />} />
          
          {/* School Routes */}
          <Route path="schools" element={<Schools />} />
          <Route path="schools/create" element={<CreateSchool />} />
          <Route path="schools/edit/:id" element={<EditSchool />} />
          
          {/* Module Routes */}
          <Route path="modules" element={<Navigate to="manage" replace />} />
          <Route path="modules/manage" element={<ModulesManage />} />
          <Route path="modules/add" element={<AddModules />} />
          <Route path="modules/edit/:id" element={<EditModules />} />
          
          {/* Level Routes */}
          {/* ✅ FIX 2: Changed "levels/manage" to "manage" to prevent double paths */}
          <Route path="levels" element={<Navigate to="manage" replace />} />
          <Route path="levels/manage" element={<LevelManage />} />
          <Route path="levels/add" element={<AddLevels />} />
          <Route path="levels/edit/:id" element={<EditLevels />} />
          
          {/* Grade Routes */}
          {/* ✅ FIX 3: Changed "grades/manage" to "manage" */}
          <Route path="grades" element={<Navigate to="manage" replace />} />
          <Route path="grades/manage" element={<GradeManage />} />
          <Route path="grades/add" element={<AddGrade />} />
          <Route path="grades/edit/:id" element={<EditGrade />} />

          {/* Profile Settings */}
          <Route path="settings" element={<ProfileSettings />} />
        </Routes>
      </div>
    </>
  );
};

export default AdminRoutes;