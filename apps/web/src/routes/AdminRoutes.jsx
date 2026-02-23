import { useState } from "react";
import { useOutletContext, Routes, Route } from "react-router-dom";
import AdminSidebar from "../components/sidebar/AdminSidebar"; // Ensure path is correct

// --- Import Admin Pages ---
import Users from "../pages/admin/users/Users";
import CreateUser from "../pages/admin/users/Create";
import Schools from "../pages/admin/schools/Schools";
import CreateSchool from "../pages/admin/schools/Create";

const AdminRoutes = () => {
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
          <Route path="dashboard" element={<div className="p-6">Admin Dashboard Content</div>} />

          {/* User Routes */}
          <Route path="users" element={<Users />} />
          <Route path="users/create" element={<CreateUser />} />
          {/* <Route path="users/edit/:id" element={<EditUser />} /> */}
          
          {/* School Routes */}
          <Route path="schools" element={<Schools />} />
          <Route path="schools/create" element={<CreateSchool />} />
          {/* <Route path="schools/edit/:id" element={<EditSchool />} /> */}
        </Routes>
      </div>
    </>
  );
};

export default AdminRoutes;