import { useState } from "react";
import { useOutletContext, Routes, Route } from "react-router-dom";
import SchoolSidebar from "../components/sidebar/SchoolSidebar";
import NeedsRegistry from "../pages/SchoolAdmin/NeedsRegistry";

// --- Import Pages ---
import Students from "../pages/school/students/Students";
import CreateStudent from "../pages/school/students/Create";
import Teachers from "../pages/school/teachers/Teachers";
import CreateTeacher from "../pages/school/teachers/Create";

const SchoolAdminRoutes = () => {
  const { isMobileMenuOpen, setIsMobileMenuOpen } = useOutletContext();
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <>
      <SchoolSidebar 
        isOpen={isMobileMenuOpen} 
        close={() => setIsMobileMenuOpen(false)} 
        isExpanded={isExpanded}
        setIsExpanded={setIsExpanded}
      />
      
      <div className={`transition-all duration-300 ${isExpanded ? "md:pl-64" : "md:pl-20"}`}>
        <Routes>
          <Route path="dashboard" element={<div>School Dashboard Content</div>} />
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

export default SchoolAdminRoutes;