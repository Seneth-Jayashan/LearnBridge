import { useState } from "react";
import { useOutletContext, Routes, Route } from "react-router-dom";
import DonorSidebar from "../components/sidebar/DonorSidebar"; // Ensure path matches your folder structure
import BrowseNeeds from "../pages/Donor/BrowseNeeds";
import MyDonations from "../pages/Donor/MyDonation";
import Overview from "../pages/Donor/Overview";
import ImpactReports from "../pages/Donor/ImpactReports";

const DonorRoutes = () => {
  const { isMobileMenuOpen, setIsMobileMenuOpen } = useOutletContext();
  
  // 1. Move the expand/shrink state HERE
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <>
      {/* 2. Pass the state and setter as props to the sidebar */}
      <DonorSidebar 
        isOpen={isMobileMenuOpen} 
        close={() => setIsMobileMenuOpen(false)} 
        isExpanded={isExpanded}
        setIsExpanded={setIsExpanded}
      />
      
      {/* 3. Make the padding dynamic based on the state! */}
      <div className={`transition-all duration-300 ${isExpanded ? "md:pl-64" : "md:pl-20"}`}>
        <Routes>
          <Route path="Overview" element={<Overview />} />
          <Route path="browse" element={<BrowseNeeds />} />
          <Route path="donations" element={<MyDonations />} />
          <Route path="impact" element={<ImpactReports />} />
          
          
          
        </Routes>
      </div>
    </>
  );
};

export default DonorRoutes;