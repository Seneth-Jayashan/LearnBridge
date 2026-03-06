import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FiMenu } from 'react-icons/fi';

export default function DashboardLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  
  // Note: We leave the state toggle here so you can pass it down to your 
  // custom role-specific sidebars via context or props later if needed.
  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      
      {/* --- Main Content Area --- */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden w-full">
        
        {/* Top Header */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-6 lg:px-10 shrink-0 w-full z-10">
          
          {/* Mobile Menu Button (Triggers your custom sidebars) */}
          <button 
            className="md:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            onClick={toggleMobileMenu}
            aria-label="Toggle Sidebar"
          >
            <FiMenu className="w-6 h-6" />
          </button>

          {/* Page Title (Changes dynamically based on role) */}
          <h1 className="hidden md:block text-2xl font-bold text-[#0E2A47] capitalize">
            {user?.role ? user.role.replace("_", " ") : "User"} Dashboard
          </h1>

          {/* User Profile Info */}
          <div className="flex items-center gap-4 ml-auto">
             <div className="text-right hidden sm:block">
               <p className="text-sm font-bold text-slate-800 tracking-tight">
                 {user?.firstName} {user?.lastName}
               </p>
               <p className="text-xs font-medium text-[#207D86] capitalize">
                 {user?.role ? user.role.replace("_", " ") : "User"}
               </p>
             </div>
             
             {/* Fixed: bg-gradient-to-br instead of bg-linear-to-br */}
             <div className="w-10 h-10 rounded-full bg-linear-to-br from-[#207D86] to-[#4CAF50] flex items-center justify-center text-white font-bold shadow-md border-2 border-white uppercase">
                {user?.firstName?.[0] || ""}{user?.lastName?.[0] || ""}
             </div>
          </div>
        </header>

        {/* Actual Page Content (Scrollable Area) */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-slate-50 relative">
           {/* Passing isMobileMenuOpen to Outlet context so sidebars can listen to it */}
           <Outlet context={{ isMobileMenuOpen, setIsMobileMenuOpen }} />
        </main>
      </div>

    </div>
  );
}