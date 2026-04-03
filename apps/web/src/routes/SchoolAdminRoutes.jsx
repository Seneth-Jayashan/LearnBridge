import { useOutletContext, Routes, Route } from "react-router-dom";
import SchoolSidebar from "../components/sidebar/SchoolSidebar";

const adminRoutes = () => {
  const { isMobileMenuOpen, setIsMobileMenuOpen, isExpanded, setIsExpanded } = useOutletContext();

  return (
    <>
      {/* 2. Pass the state and setter as props to the sidebar */}
      <SchoolSidebar 
        isOpen={isMobileMenuOpen} 
        close={() => setIsMobileMenuOpen(false)} 
        isExpanded={isExpanded}
        setIsExpanded={setIsExpanded}
      />
      
      {/* 3. Content area (DashboardLayout now offsets for fixed sidebar) */}
      <div className="w-full transition-all duration-300">
        <Routes>
          <Route path="dashboard" element={<div>School Dashboard Content</div>} />
          {/* ... Add your other admin routes here ... */}
        </Routes>
      </div>
    </>
  );
};

export default adminRoutes;