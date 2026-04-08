import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { 
  FiMenu, FiX, FiLogOut, FiUser, FiGrid, FiSettings, FiAlertCircle 
} from "react-icons/fi";
import LogoImage from "../assets/Learn Bridge Logo 2.png";

const Navbar = () => {
  const { 
    user, logout, isAuthenticated, 
    isSuperAdmin, isSchoolAdmin, isTeacher, isDonor, isStudent 
  } = useAuth();
  
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    setMobileMenuOpen(false);
  };

  const NavLink = ({ to, children, icon: Icon }) => {
    const isActive = location.pathname === to || (location.pathname.includes(to) && to !== "/");
    return (
      <Link
        to={to}
        onClick={() => setMobileMenuOpen(false)}
        className={`flex items-center gap-2 px-4 py-2 font-semibold transition-all rounded-xl text-sm ${
          isActive
            ? "text-[#207D86] bg-[#207D86]/10" 
            : "text-slate-600 hover:text-[#0A1D32] hover:bg-slate-100"
        }`}
      >
        {Icon && <Icon className="w-4 h-4" />}
        {children}
      </Link>
    );
  };

  return (
    <div className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      <nav
        className={`w-full max-w-6xl transition-all duration-300 ease-in-out bg-white/90 backdrop-blur-xl border border-slate-200/50 rounded-2xl pointer-events-auto ${
          isScrolled ? "shadow-2xl shadow-black/5 py-3" : "shadow-lg shadow-black/5 py-4"
        }`}
      >
        <div className="px-6 flex justify-between items-center">
          
          {/* --- Logo --- */}
          <Link to="/" className="flex items-center gap-3 group">
            <img src={LogoImage} alt="Logo" className="w-10 h-10 rounded-xl object-cover group-hover:rotate-3 transition-transform shadow-sm" />
            <span className="text-xl font-extrabold tracking-tight bg-linear-to-r from-[#0E2A47] to-[#207D86] bg-clip-text text-transparent">
              LearnBridge
            </span>
          </Link>

          {/* --- Desktop Menu --- */}
          <div className="hidden md:flex items-center gap-2">
            <NavLink to="/">Home</NavLink>
            <NavLink to="/knowledge-base">Knowledge Base</NavLink>
            
            {isAuthenticated ? (
              <>
                <NavLink to="/dashboard" icon={FiGrid}>Dashboard</NavLink>
                
                {/* Conditional Admin Links */}
                {isSuperAdmin && <NavLink to="/admin" icon={FiSettings}>Super Admin</NavLink>}
                {isSchoolAdmin && <NavLink to="/school" icon={FiSettings}>School</NavLink>}
                
                <div className="h-8 w-px bg-slate-200 mx-2"></div>
                
                <div className="flex items-center gap-4">
                  {/* Teacher Verification Badge */}
                  {isTeacher && !user?.isSchoolVerified && (
                    <div className="flex items-center gap-1 px-3 py-1.5 bg-amber-50 text-amber-600 rounded-full text-xs font-bold uppercase tracking-wide border border-amber-200">
                      <FiAlertCircle /> Pending
                    </div>
                  )}

                  <Link to="/profile" className="flex items-center gap-2 group">
                    <div className="w-10 h-10 rounded-full bg-linear-to-br from-[#207D86] to-[#4CAF50] flex items-center justify-center text-white text-sm font-bold border-2 border-white shadow-md group-hover:scale-105 transition-transform uppercase">
                      {user?.firstName?.[0] || "U"}{user?.lastName?.[0] || ""}
                    </div>
                  </Link>
                  
                  <button 
                    onClick={handleLogout}
                    className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    title="Logout"
                  >
                    <FiLogOut className="w-5 h-5" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3 ml-2">
                <Link 
                  to="/login" 
                  className="px-6 py-2.5 bg-[#0A1D32] hover:bg-[#207D86] text-white text-sm font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>

          {/* --- Mobile Button --- */}
          <button className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
          </button>
        </div>

        {/* --- Mobile Dropdown --- */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-[calc(100%+0.5rem)] left-0 right-0 p-4 bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-100 flex flex-col gap-2 origin-top animate-in fade-in slide-in-from-top-4 duration-200">
            <NavLink to="/">Home</NavLink>
            <NavLink to="/knowledge-base">Knowledge Base</NavLink>
            
            {isAuthenticated ? (
              <>
                <div className="h-px bg-slate-100 my-2"></div>
                <NavLink to="/dashboard" icon={FiGrid}>Dashboard</NavLink>
                {isSuperAdmin && <NavLink to="/admin" icon={FiSettings}>Super Admin</NavLink>}
                {isSchoolAdmin && <NavLink to="/school" icon={FiSettings}>School Admin</NavLink>}
                <NavLink to="/profile" icon={FiUser}>Profile Settings</NavLink>
                <button onClick={handleLogout} className="flex items-center justify-center gap-2 px-4 py-3 text-red-600 bg-red-50 font-bold rounded-xl w-full mt-2 hover:bg-red-100 transition-colors">
                  <FiLogOut /> Logout Account
                </button>
              </>
            ) : (
              <>
                <div className="h-px bg-slate-100 my-2"></div>
                <NavLink to="/login">Sign In</NavLink>
                <Link to="/register-donor" onClick={() => setMobileMenuOpen(false)} className="w-full text-center mt-2 px-5 py-3.5 bg-[#0E2A47] text-white font-semibold rounded-xl">
                  Join as Donor
                </Link>
              </>
            )}
          </div>
        )}
      </nav>
    </div>
  );
};

export default Navbar;