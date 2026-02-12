import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { FiMenu, FiX, FiLogOut, FiUser, FiGrid, FiSettings } from "react-icons/fi";
import LogoImage from "../assets/Learn Bridge Logo 2.png";

const Navbar = () => {
  const { user, logout, isAuthenticated, isAdmin, isTeacher } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Handle Scroll Effect
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    setMobileMenuOpen(false);
  };

  const NavLink = ({ to, children, icon: Icon }) => (
    <Link
      to={to}
      onClick={() => setMobileMenuOpen(false)}
      className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors rounded-lg hover:bg-[#207D86]/5 ${
        location.pathname === to ? "text-[#207D86] bg-[#207D86]/5" : "text-slate-600 hover:text-[#207D86]"
      }`}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </Link>
  );

  return (
    <div className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4">
      <nav
        className={`w-full max-w-5xl transition-all duration-300 ease-in-out bg-white/90 backdrop-blur-md border border-white/20 rounded-2xl ${
          isScrolled ? "shadow-lg shadow-black/5 py-3" : "shadow-md py-4"
        }`}
      >
        <div className="px-6 flex justify-between items-center">
          
          {/* --- Logo --- */}
          <Link to="/" className="flex items-center gap-3 group">
            <img 
              src={LogoImage} 
              alt="Logo" 
              className="w-10 h-10 rounded-lg object-cover group-hover:scale-105 transition-transform duration-300" 
            />
            <span className="text-xl font-bold bg-gradient-to-r from-[#0E2A47] to-[#207D86] bg-clip-text text-transparent">
              LearnBridge
            </span>
          </Link>

          {/* --- Desktop Menu --- */}
          <div className="hidden md:flex items-center gap-1">
            <NavLink to="/">Home</NavLink>
            
            {isAuthenticated ? (
              <>
                <NavLink to="/dashboard" icon={FiGrid}>Dashboard</NavLink>
                
                {isAdmin && <NavLink to="/admin" icon={FiSettings}>Admin</NavLink>}
                {(isTeacher || isAdmin) && <NavLink to="/grades">Grades</NavLink>}
                
                <div className="h-6 w-px bg-slate-200 mx-2"></div>
                
                <div className="flex items-center gap-3 ml-2">
                  <Link to="/profile" className="flex items-center gap-2 text-sm font-semibold text-[#0E2A47]">
                     <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#207D86] to-[#4CAF50] flex items-center justify-center text-white text-xs shadow-sm">
                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                     </div>
                     <span className="hidden lg:block">{user?.firstName}</span>
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                    title="Logout"
                  >
                    <FiLogOut className="w-5 h-5" />
                  </button>
                </div>
              </>
            ) : (
              <>
                <NavLink to="/login">Login</NavLink>
                <Link 
                  to="/register-donor" 
                  className="ml-2 px-5 py-2.5 bg-[#0E2A47] hover:bg-[#207D86] text-white text-sm font-semibold rounded-xl shadow-lg shadow-[#0E2A47]/20 transition-all hover:-translate-y-0.5"
                >
                  Join as Donor
                </Link>
              </>
            )}
          </div>

          {/* --- Mobile Menu Button --- */}
          <button 
            className="md:hidden p-2 text-slate-600"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
          </button>
        </div>

        {/* --- Mobile Dropdown --- */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 mt-2 mx-2 p-4 bg-white rounded-2xl shadow-xl border border-slate-100 flex flex-col gap-2">
            <NavLink to="/">Home</NavLink>
            
            {isAuthenticated ? (
              <>
                <NavLink to="/dashboard" icon={FiGrid}>Dashboard</NavLink>
                {isAdmin && <NavLink to="/admin" icon={FiSettings}>Admin Panel</NavLink>}
                {(isTeacher || isAdmin) && <NavLink to="/grades">Manage Grades</NavLink>}
                <NavLink to="/profile" icon={FiUser}>My Profile</NavLink>
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 text-red-500 hover:bg-red-50 font-medium rounded-lg w-full text-left"
                >
                  <FiLogOut className="w-4 h-4" /> Logout
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login">Login</NavLink>
                <Link 
                  to="/register-donor" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center mt-2 px-5 py-3 bg-[#0E2A47] text-white font-semibold rounded-xl"
                >
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