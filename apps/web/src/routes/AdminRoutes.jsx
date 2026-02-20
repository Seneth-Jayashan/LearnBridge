import { useState } from "react";
import { useOutletContext, Routes, Route } from "react-router-dom";
import AdminSidebar from "../components/sidebar/AdminSidebar";

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
          {/* ... Add your other admin routes here ... */}
        </Routes>
      </div>
    </>
  );
};

export default adminRoutes;