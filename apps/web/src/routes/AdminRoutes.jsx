import { useState } from "react";
import { useOutletContext, Routes, Route, Navigate } from "react-router-dom";
import AdminSidebar from "../components/sidebar/AdminSidebar";
import ModulesManage from "../pages/admin/Modules/ModulesManage";
import LevelManage from "../pages/admin/Levels/LevelManage";
import AddLevels from "../pages/admin/Levels/AddLevels";
import EditLevels from "../pages/admin/Levels/EditLevels";
import GradeManage from "../pages/admin/Grades/GradeManage";
import AddGrade from "../pages/admin/Grades/AddGrade";
import EditGrade from "../pages/admin/Grades/EditGrade";

const adminRoutes = () => {
  const { isMobileMenuOpen, setIsMobileMenuOpen } = useOutletContext();
  
  // 1. Move the expand/shrink state HERE
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <>
      {/* 2. Pass the state and setter as props to the sidebar */}
      <AdminSidebar 
        isOpen={isMobileMenuOpen} 
        close={() => setIsMobileMenuOpen(false)} 
        isExpanded={isExpanded}
        setIsExpanded={setIsExpanded}
      />
      
      {/* 3. Make the padding dynamic! */}
      <div className={`transition-all duration-300 ${isExpanded ? "md:pl-64" : "md:pl-20"}`}>
        <Routes>
          <Route path="dashboard" element={<div>admin Dashboard Content</div>} />
          <Route path="modules" element={<ModulesManage />} />
          <Route path="levels" element={<Navigate to="levels/manage" replace />} />
          <Route path="levels/manage" element={<LevelManage />} />
          <Route path="levels/add" element={<AddLevels />} />
          <Route path="levels/edit/:id" element={<EditLevels />} />
          <Route path="grades" element={<Navigate to="grades/manage" replace />} />
          <Route path="grades/manage" element={<GradeManage />} />
          <Route path="grades/add" element={<AddGrade />} />
          <Route path="grades/edit/:id" element={<EditGrade />} />
          {/* ... Add your other admin routes here ... */}
        </Routes>
      </div>
    </>
  );
};

export default adminRoutes;