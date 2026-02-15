import { useState } from "react";
import { useOutletContext, Routes, Route } from "react-router-dom";
import StudentSidebar from "../components/sidebar/StudentSidebar"; // Adjust path if needed

const StudentRoutes = () => {
  const { isMobileMenuOpen, setIsMobileMenuOpen } = useOutletContext();
  
  // 1. Move the expand/shrink state HERE
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <>
      {/* 2. Pass the state and setter as props to the sidebar */}
      <StudentSidebar 
        isOpen={isMobileMenuOpen} 
        close={() => setIsMobileMenuOpen(false)} 
        isExpanded={isExpanded}
        setIsExpanded={setIsExpanded}
      />
      
      {/* 3. Make the padding dynamic! 
          Using pl-72 and pl-32 because the student sidebar floats with 'left-4'
      */}
      <div className={`transition-all duration-300 ${isExpanded ? "md:pl-72" : "md:pl-32"}`}>
        <Routes>
          <Route path="dashboard" element={<div>Dashboard Content</div>} />
          {/* ... Add other student routes here ... */}
        </Routes>
      </div>
    </>
  );
};

export default StudentRoutes;