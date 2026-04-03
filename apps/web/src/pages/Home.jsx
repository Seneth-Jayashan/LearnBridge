import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FiArrowRight, FiBookOpen, FiHeart, 
  FiShield, FiGlobe, FiUsers, FiCheck 
} from 'react-icons/fi';
import HeroImage from "../assets/hero-bg.jpg"; // Use a high-quality image of students

export default function Home() {
  return (
    <div className="flex flex-col w-full overflow-hidden bg-white">
      
      {/* --- HERO SECTION --- */}
      <section className="relative min-h-screen flex items-center pt-20 px-6 md:px-12 bg-[#0A1D32] text-white">
        {/* Abstract Background Decoration */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-linear-to-l from-[#207D86]/20 to-transparent pointer-events-none"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[60%] bg-[#4CAF50]/10 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
          <div className="space-y-8 animate-in fade-in slide-in-from-left-8 duration-700">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-[#4CAF50] text-sm font-bold tracking-wide">
              <span className="flex h-2 w-2 rounded-full bg-[#4CAF50] animate-pulse"></span>
              EMPOWERING RURAL SRI LANKA
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black leading-[1.1] tracking-tight">
              Knowledge is a <br />
              <span className="bg-linear-to-r from-[#207D86] to-[#4CAF50] bg-clip-text text-transparent">
                Shared Bridge.
              </span>
            </h1>
            
            <p className="text-lg text-slate-300 max-w-lg leading-relaxed">
              LearnBridge connects passionate educators and generous donors with students in rural areas, ensuring that quality education knows no boundaries.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link to="/register-donor" className="px-8 py-4 bg-[#4CAF50] hover:bg-[#3d8b40] text-white font-bold rounded-2xl shadow-xl shadow-[#4CAF50]/20 transition-all flex items-center justify-center gap-2 group">
                Start Donating <FiHeart className="group-hover:scale-110 transition-transform" />
              </Link>
              <Link to="/register-teacher" className="px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2">
                Join as Teacher <FiArrowRight />
              </Link>
            </div>
          </div>

          <div className="hidden lg:block relative animate-in fade-in zoom-in duration-1000">
            <div className="relative z-10 rounded-[2.5rem] overflow-hidden border-8 border-white/10 shadow-2xl">
              <img 
                src="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80&w=1000" 
                alt="Education Impact" 
                className="w-full h-auto object-cover"
              />
            </div>
            {/* Floating Stats Card */}
            <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-3xl shadow-2xl text-[#0A1D32] animate-bounce-slow">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#207D86] rounded-2xl flex items-center justify-center text-white">
                  <FiUsers size={24} />
                </div>
                <div>
                  <p className="text-2xl font-black">5,000+</p>
                  <p className="text-xs font-bold text-slate-500 uppercase">Students Helped</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- IMPACT STATS --- */}
      <section className="py-20 bg-slate-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { label: "Schools", val: "120+", icon: FiGlobe },
              { label: "Teachers", val: "450+", icon: FiBookOpen },
              { label: "Donations", val: "Rs. 2M+", icon: FiHeart },
              { label: "Security", val: "100%", icon: FiShield },
            ].map((stat, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-center text-[#207D86] mb-2"><stat.icon size={28} /></div>
                <h3 className="text-3xl font-black text-slate-800">{stat.val}</h3>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- HOW IT WORKS --- */}
      <section className="py-24 px-6 md:px-12 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl font-black text-[#0A1D32]">How LearnBridge Works</h2>
            <p className="text-slate-500 max-w-2xl mx-auto font-medium">We create a seamless ecosystem for education through three key pillars.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <WorkCard 
              icon={FiHeart} 
              title="Donors" 
              desc="Financial support goes directly to students and schools to provide resources, hardware, and infrastructure."
              color="#4CAF50"
            />
            <WorkCard 
              icon={FiBookOpen} 
              title="Teachers" 
              desc="Educators from anywhere can join registered schools or act independently to provide quality teaching."
              color="#207D86"
            />
            <WorkCard 
              icon={FiUsers} 
              title="Students" 
              desc="Rural students gain access to a world-class LMS, verified teachers, and educational sponsorships."
              color="#0A1D32"
            />
          </div>
        </div>
      </section>

      {/* --- CTA SECTION --- */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto bg-linear-to-br from-[#0E2A47] to-[#207D86] rounded-[3rem] p-10 md:p-20 text-center relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="relative z-10 space-y-8">
            <h2 className="text-3xl md:text-5xl font-black text-white leading-tight">
              Ready to build the bridge? <br />
              Join us today.
            </h2>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/register-donor" className="px-10 py-4 bg-white text-[#0E2A47] font-extrabold rounded-2xl hover:bg-slate-100 transition-all shadow-xl">
                I want to Donate
              </Link>
              <Link to="/register-teacher" className="px-10 py-4 bg-transparent border-2 border-white text-white font-extrabold rounded-2xl hover:bg-white hover:text-[#0E2A47] transition-all">
                I am a Teacher
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="py-10 text-center border-t border-slate-100 text-slate-400 text-sm font-medium">
        <p>© {new Date().getFullYear()} OneX Universe (Pvt) Ltd. All rights reserved.</p>
      </footer>
    </div>
  );
}

// Sub-component for Work Cards
const WorkCard = ({ icon: Icon, title, desc, color }) => (
  <div className="p-10 rounded-[2.5rem] bg-slate-50 border border-slate-100 transition-all hover:-translate-y-2 hover:shadow-xl group">
    <div 
      className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 text-white transition-all group-hover:scale-110"
      style={{ backgroundColor: color }}
    >
      <Icon size={30} />
    </div>
    <h3 className="text-2xl font-black mb-4 text-[#0A1D32]">{title}</h3>
    <p className="text-slate-500 leading-relaxed font-medium mb-6">{desc}</p>
    <ul className="space-y-2">
      {["Verified Profiles", "Real-time Impact", "Transparent Data"].map((item, idx) => (
        <li key={idx} className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase">
          <FiCheck className="text-[#4CAF50]" /> {item}
        </li>
      ))}
    </ul>
  </div>
);