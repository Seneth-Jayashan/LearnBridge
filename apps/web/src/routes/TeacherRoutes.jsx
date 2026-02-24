import { useState } from "react";
import { useOutletContext, Routes, Route, Navigate } from "react-router-dom";
import TeacherSidebar from "../components/sidebar/TeacherSidebar";
import TeacherDashboard from "../pages/teacher/Dashboard";
import LessonsAdd from "../pages/teacher/lessons/LessonsAdd";
import LessonsManage from "../pages/teacher/lessons/LessonsManage";
import LessonsEdit from "../pages/teacher/lessons/LessonsEdit";

const TeacherRoutes = () => {
  const { isMobileMenuOpen, setIsMobileMenuOpen } = useOutletContext();
  
  // 1. Move the expand/shrink state HERE
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <>
      {/* 2. Pass the state and setter as props to the sidebar */}
      <TeacherSidebar 
        isOpen={isMobileMenuOpen} 
        close={() => setIsMobileMenuOpen(false)} 
        isExpanded={isExpanded}
        setIsExpanded={setIsExpanded}
      />
      
      {/* 3. Make the padding dynamic based on the isExpanded state! */}
      <div className={`transition-all duration-300 ${isExpanded ? "md:pl-64" : "md:pl-20"}`}>
        <Routes>
          <Route path="dashboard" element={<TeacherDashboard />} />
          <Route path="lessons" element={<Navigate to="manage" replace />} />
          <Route path="lessons/add" element={<LessonsAdd />} />
          <Route path="lessons/manage" element={<LessonsManage />} />
          <Route path="lessons/edit/:id" element={<LessonsEdit />} />
        </Routes>
      </div>
    </>
  );
};

export default TeacherRoutes;