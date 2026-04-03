import { useOutletContext, Routes, Route } from "react-router-dom";
import DonorSidebar from "../components/sidebar/DonorSidebar"; // Ensure path matches your folder structure

const DonorRoutes = () => {
  const { isMobileMenuOpen, setIsMobileMenuOpen, isExpanded, setIsExpanded } = useOutletContext();

  return (
    <>
      {/* 2. Pass the state and setter as props to the sidebar */}
      <DonorSidebar 
        isOpen={isMobileMenuOpen} 
        close={() => setIsMobileMenuOpen(false)} 
        isExpanded={isExpanded}
        setIsExpanded={setIsExpanded}
      />
      
      {/* 3. Content area (DashboardLayout now offsets for fixed sidebar) */}
      <div className="w-full transition-all duration-300">
        <Routes>
          <Route path="dashboard" element={<div>Dashboard Content</div>} />
          {/* ... Add your other donor routes here ... */}
        </Routes>
      </div>
    </>
  );
};

export default DonorRoutes;