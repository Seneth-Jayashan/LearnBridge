import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FiArrowRight, FiBookOpen, FiHeart, 
  FiShield, FiGlobe, FiUsers, FiCheck 
} from 'react-icons/fi';
// import HeroImage from "../assets/hero-bg.jpg"; // Swap this in when you have the local asset

export default function Home() {
  return (
    <div className="flex flex-col w-full bg-white">
      
      {/* --- HERO SECTION --- */}
      <section className="relative min-h-[90vh] flex items-center pt-32 pb-32 px-6 md:px-12 bg-[#0A1D32] overflow-hidden">
        {/* Ambient Glow Effects */}
        <div className="absolute top-0 right-0 w-3/4 h-full bg-linear-to-bl from-[#207D86]/20 via-transparent to-transparent pointer-events-none"></div>
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-[#4CAF50]/20 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center relative z-10 w-full">
          
          {/* Hero Text Content */}
          <div className="lg:col-span-6 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-md rounded-full border border-white/10 text-[#4CAF50] text-xs font-bold tracking-widest uppercase shadow-sm">
              <span className="flex h-2 w-2 rounded-full bg-[#4CAF50] animate-pulse"></span>
              Empowering Rural Sri Lanka
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[1.1] tracking-tight">
              Knowledge is a <br />
              <span className="bg-linear-to-r from-[#4CAF50] to-[#207D86] bg-clip-text text-transparent">
                Shared Bridge.
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-slate-300 max-w-lg leading-relaxed font-light">
              We connect passionate educators and generous donors with students in rural areas, ensuring that quality education knows no boundaries.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <Link to="/register-donor" className="px-8 py-4 bg-[#4CAF50] hover:bg-[#43a047] text-white font-semibold rounded-xl shadow-lg shadow-[#4CAF50]/20 transition-all flex items-center justify-center gap-2 group">
                Start Donating <FiHeart className="group-hover:scale-110 transition-transform" />
              </Link>
              <Link to="/register-teacher" className="px-8 py-4 bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 group">
                Join as Teacher <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Hero Image & Graphics */}
          <div className="lg:col-span-6 relative animate-in fade-in zoom-in duration-1000 delay-200 hidden md:block">
            
            <div className="relative z-10 rounded-4xl overflow-hidden border border-white/10 shadow-2xl bg-[#0E2A47]">
              <img 
                src="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80&w=1000" 
                alt="Education Impact" 
                className="w-full h-125 object-cover opacity-90 hover:opacity-100 transition-opacity duration-500"
              />
              <div className="absolute inset-0 bg-linear-to-t from-[#0A1D32] via-transparent to-transparent opacity-80"></div>
            </div>
            
            <div className="absolute z-20 -bottom-8 -left-8 bg-white/10 backdrop-blur-xl border border-white/20 p-5 rounded-2xl shadow-2xl text-white animate-[bounce_4s_ease-in-out_infinite]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-linear-to-br from-[#207D86] to-[#0A1D32] rounded-xl flex items-center justify-center text-white shadow-inner">
                  <FiUsers size={24} />
                </div>
                <div>
                  <p className="text-2xl font-black">5,000+</p>
                  <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Students Helped</p>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </section>

      {/* --- OVERLAPPING IMPACT STATS --- */}
      <section className="relative z-20 -mt-16 px-6 max-w-7xl mx-auto w-full">
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 md:p-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4 divide-x-0 md:divide-x divide-slate-100 text-center">
            {[
              { label: "Partner Schools", val: "120+", icon: FiGlobe },
              { label: "Verified Teachers", val: "450+", icon: FiBookOpen },
              { label: "Donations Raised", val: "Rs. 2M+", icon: FiHeart },
              { label: "Secure Platform", val: "100%", icon: FiShield },
            ].map((stat, i) => (
              <div key={i} className="flex flex-col items-center space-y-3">
                <div className="flex justify-center text-[#207D86] bg-[#207D86]/10 p-3 rounded-2xl mb-2">
                  <stat.icon size={24} />
                </div>
                <h3 className="text-3xl md:text-4xl font-black text-[#0A1D32]">{stat.val}</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- HOW IT WORKS --- */}
      <section className="py-24 px-6 md:px-12 bg-slate-50 mt-10">
        <div className="max-w-7xl mx-auto w-full">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl md:text-5xl font-black text-[#0A1D32]">How LearnBridge Works</h2>
            <p className="text-slate-500 max-w-2xl mx-auto text-lg">
              We create a seamless, transparent ecosystem for education through three key pillars.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <WorkCard 
              icon={FiHeart} 
              title="For Donors" 
              desc="Your financial support goes directly to students and schools to provide resources, hardware, and infrastructure. Track where every penny goes."
              color="#4CAF50"
            />
            <WorkCard 
              icon={FiBookOpen} 
              title="For Teachers" 
              desc="Educators from anywhere can join registered schools or act independently to provide quality teaching through our integrated LMS."
              color="#207D86"
            />
            <WorkCard 
              icon={FiUsers} 
              title="For Students" 
              desc="Rural students gain access to a world-class platform, verified educators, and educational sponsorships to bridge the gap."
              color="#0A1D32"
            />
          </div>
        </div>
      </section>

      {/* --- CTA SECTION --- */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto bg-linear-to-br from-[#0A1D32] via-[#0E2A47] to-[#207D86] rounded-[2.5rem] p-12 md:p-20 text-center relative overflow-hidden shadow-2xl">
          {/* Abstract Texture Overlay */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
          
          <div className="relative z-10 space-y-8 flex flex-col items-center">
            <h2 className="text-4xl md:text-5xl font-black text-white leading-tight max-w-3xl">
              Ready to build the bridge? <br className="hidden md:block" />
              Join us today.
            </h2>
            <p className="text-slate-300 text-lg max-w-xl">
              Whether you have time to teach, money to give, or a school that needs help, there is a place for you here.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 w-full sm:w-auto pt-4">
              <Link to="/register-donor" className="px-10 py-4 bg-white text-[#0A1D32] font-bold rounded-xl hover:bg-slate-100 transition-all shadow-xl text-center">
                I want to Donate
              </Link>
              <Link to="/register-teacher" className="px-10 py-4 bg-transparent border-2 border-white/30 text-white font-bold rounded-xl hover:bg-white hover:text-[#0A1D32] transition-all text-center">
                I am a Teacher
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// Sub-component for Work Cards
const WorkCard = ({ icon: Icon, title, desc, color }) => (
  <div className="p-8 rounded-4xl bg-white border border-slate-100 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/50 group flex flex-col h-full">
    <div 
      className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 text-white transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-md"
      style={{ backgroundColor: color }}
    >
      <Icon size={24} />
    </div>
    <h3 className="text-2xl font-black mb-3 text-[#0A1D32]">{title}</h3>
    <p className="text-slate-500 leading-relaxed font-medium mb-8 grow">{desc}</p>
    
    <ul className="space-y-3 mt-auto">
      {["Verified Profiles", "Real-time Impact", "Transparent Data"].map((item, idx) => (
        <li key={idx} className="flex items-center gap-3 text-sm font-bold text-slate-600">
          <div className="flex items-center justify-center w-5 h-5 rounded-full bg-[#4CAF50]/10 text-[#4CAF50]">
            <FiCheck size={12} strokeWidth={4} />
          </div>
          {item}
        </li>
      ))}
    </ul>
  </div>
);