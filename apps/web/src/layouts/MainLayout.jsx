import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function MainLayout() {
  const location = useLocation();
  
  // ADD "/register-teacher" TO THIS ARRAY
  const isFullBleedPage = ["/", "/login", "/register-donor", "/register-teacher"].includes(location.pathname);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      <Navbar />
      
      <main className={`grow ${!isFullBleedPage ? 'pt-32 px-4 md:px-8 pb-10 max-w-7xl mx-auto w-full' : ''}`}>
        <Outlet />
      </main>
      
      {!isFullBleedPage && <Footer />}
    </div>
  );
}