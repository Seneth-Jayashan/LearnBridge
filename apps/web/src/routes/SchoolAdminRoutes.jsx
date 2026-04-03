import { useState } from "react";
import { useOutletContext, Routes, Route } from "react-router-dom";
import SchoolSidebar from "../components/sidebar/SchoolSidebar";
import NeedsRegistry from "../pages/SchoolAdmin/NeedsRegistry";

const adminRoutes = () => {
  const { isMobileMenuOpen, setIsMobileMenuOpen } = useOutletContext();
  
  // 1. Move the expand/shrink state HERE
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <>
      {/* 2. Pass the state and setter as props to the sidebar */}
      <SchoolSidebar 
        isOpen={isMobileMenuOpen} 
        close={() => setIsMobileMenuOpen(false)} 
        isExpanded={isExpanded}
        setIsExpanded={setIsExpanded}
      />
      
      {/* 3. Make the padding dynamic! */}
      <div className={`transition-all duration-300 `}>
        <Routes>
          <Route path="dashboard" element={<div>School Dashboard Content</div>} />
          {/* ... Add your other admin routes here ... */}
          <Route path="needsRegistry" element={<NeedsRegistry />} />
          
          {/* Student Routes */}
          <Route path="students" element={<Students />} />
          <Route path="students/create" element={<CreateStudent />} />
          {/* <Route path="students/edit/:id" element={<EditStudent />} /> */}
          
          {/* Teacher Routes (Placeholders for next steps) */}
          <Route path="teachers" element={<Teachers />} />
          <Route path="teachers/create" element={<CreateTeacher />} />
          
        </Routes>
      </div>
    </>
  );
};

export default adminRoutes;