import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { FiMenu } from 'react-icons/fi'; // <-- Add this import for the hamburger icon

export default function DashboardLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      
      <div 
        className={`flex flex-col h-screen overflow-hidden transition-all duration-300 ${isExpanded ? 'md:ml-64' : 'md:ml-20'}`}
      >
        
        {/* --- Mobile Header (Only visible on small screens) --- */}
        <header className="md:hidden flex items-center justify-between bg-[#0A1D32] text-white p-4 shadow-md z-30">
          <div className="font-bold tracking-wide">School Admin</div>
          <button 
            onClick={() => setIsMobileMenuOpen(true)} // <-- This opens the sidebar!
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          >
            <FiMenu className="w-6 h-6" />
          </button>
        </header>

        {/* --- Actual Page Content --- */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-10 bg-slate-50 relative">
           <Outlet 
             context={{ 
               isMobileMenuOpen, 
               setIsMobileMenuOpen, 
               isExpanded, 
               setIsExpanded 
             }} 
           />
        </main>
      </div>

    </div>
  );
}