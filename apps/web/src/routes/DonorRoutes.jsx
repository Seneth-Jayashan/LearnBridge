import { useOutletContext, Routes, Route } from "react-router-dom";
import DonorSidebar from "../components/sidebar/DonorSidebar"; // Ensure path matches your folder structure
import BrowseNeeds from "../pages/Donor/BrowseNeeds";
import MyDonations from "../pages/Donor/MyDonation";
import Overview from "../pages/Donor/Overview";
import ImpactReports from "../pages/Donor/ImpactReports";
import ProfileSettings from "../pages/Donor/ProfileSetting";

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
          <Route index element={<Overview />} />
          <Route path="overview" element={<Overview />} />
          <Route path="browse" element={<BrowseNeeds />} />
          <Route path="donations" element={<MyDonations />} />
          <Route path="impact" element={<ImpactReports />} />
          <Route path="profile" element={<ProfileSettings />} />
          
          
          
        </Routes>
      </div>
    </>
  );
};

export default DonorRoutes;