import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function MainLayout() {
  const location = useLocation();
  
  // We don't want the top padding on the Login and Register pages 
  // because they have their own full-screen centered designs.
  const isAuthPage = ["/login", "/register-donor"].includes(location.pathname);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* 1. The Floating Navbar */}
      <Navbar />
      
      {/* 2. The Page Content */}
      {/* If it's an Auth page, no padding. Otherwise, add padding so content isn't under the navbar */}
      <main className={`grow ${!isAuthPage ? 'pt-28 px-4 pb-10' : ''}`}>
        <Outlet /> {/* This is where child routes (Home, Login, etc.) will render */}
      </main>
    </div>
  );
}