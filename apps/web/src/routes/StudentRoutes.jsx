import { useOutletContext, Routes, Route } from "react-router-dom";
import StudentSidebar from "../components/sidebar/StudentSidebar"; // Adjust path if needed
import StudentModules from "../pages/student/StudentModules";
import StudentAssignments from "../pages/student/StudentAssignments";

const StudentRoutes = () => {
  const { isMobileMenuOpen, setIsMobileMenuOpen, isExpanded, setIsExpanded } = useOutletContext();

  return (
    <>
      {/* 2. Pass the state and setter as props to the sidebar */}
      <StudentSidebar 
        isOpen={isMobileMenuOpen} 
        close={() => setIsMobileMenuOpen(false)} 
        isExpanded={isExpanded}
        setIsExpanded={setIsExpanded}
      />
      
        {/* 3. Content area (DashboardLayout now offsets for fixed sidebar) */}
        <div className="w-full transition-all duration-300">
        <Routes>
          <Route path="dashboard" element={<div>Dashboard Content</div>} />
          <Route path="modules" element={<StudentModules />} />
          <Route path="assignments" element={<StudentAssignments />} />
          {/* ... Add other student routes here ... */}
        </Routes>
      </div>
    </>
  );
};

export default StudentRoutes;