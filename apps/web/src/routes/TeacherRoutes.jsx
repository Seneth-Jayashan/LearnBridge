import { useState } from "react";
import { useOutletContext, Routes, Route } from "react-router-dom";
import TeacherSidebar from "../components/sidebar/TeacherSidebar";
import Courses from "../pages/Courses";

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
          <Route path="dashboard" element={<div>Dashboard Content</div>} />
          {/* Course routes: allow /courses, /courses/add, /courses/manage */}
          <Route path="courses" element={<Courses mode="both" />} />
          <Route path="courses/add" element={<Courses mode="add" />} />
          <Route path="courses/manage" element={<Courses mode="manage" />} />
        </Routes>
      </div>
    </>
  );
};

export default TeacherRoutes;