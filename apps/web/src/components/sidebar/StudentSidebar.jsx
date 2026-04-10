import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { 
  FiHome, FiPlayCircle, FiCheckSquare, FiAward, 
  FiChevronLeft, FiChevronRight, FiLogOut,
  FiChevronDown, FiChevronUp, FiList, FiBarChart2,
  FiSettings
} from "react-icons/fi";

const StudentSidebar = ({ isOpen, close, isExpanded, setIsExpanded }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  // Unified menu structure
  const menuItems = [
    { 
      name: "My Hub", 
      path: "/student/dashboard", 
      icon: FiHome 
    },
    { 
      name: "Modules", 
      path: "/student/modules", 
      icon: FiPlayCircle 
    },
    { 
      name: "Assignments", 
      path: "/student/assignments", 
      icon: FiCheckSquare 
    },
    {
      name: "Quizzes",
      icon: FiAward,
      basePath: "/student/quiz",
      altBasePath: "/student/results",
      subLinks: [
        { name: "Quiz List", path: "/student/quizzes", icon: FiList },
        { name: "My Results", path: "/student/results", icon: FiBarChart2 },
      ]
    },
    { 
      name: "Settings", 
      path: "/student/settings", 
      icon: FiSettings 
    },
  ];

  // Dynamically track which dropdowns are open based on current URL
  const [openMenus, setOpenMenus] = useState(() => {
    const initialState = {};
    menuItems.forEach(item => {
      if (item.subLinks) {
        initialState[item.name] = 
          location.pathname.includes(item.basePath) || 
          (item.altBasePath && location.pathname.includes(item.altBasePath)) ||
          item.subLinks.some(link => location.pathname.includes(link.path));
      }
    });
    return initialState;
  });

  const toggleMenu = (menuName) => {
    if (!isExpanded) {
      setIsExpanded(true); // Auto-expand sidebar if trying to open a dropdown while collapsed
    }
    setOpenMenus(prev => ({
      ...prev,
      [menuName]: !prev[menuName]
    }));
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
    if (isExpanded) {
      // Optional: Close all dropdowns when sidebar collapses
      setOpenMenus({});
    }
  };

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-[#0E2A47]/60 z-40 md:hidden backdrop-blur-sm transition-opacity" onClick={close} />}

      <aside className={`fixed top-0 left-0 h-screen bg-[#0A1D32] text-white z-50 transition-all duration-300 ease-in-out flex flex-col shadow-2xl md:shadow-[4px_0_24px_rgba(0,0,0,0.15)]
        ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0
        ${isExpanded ? "w-64" : "w-20"}
      `}>

        {/* Toggle Button */}
        <button
          onClick={handleToggleExpand}
          className="hidden md:flex absolute top-9 -right-3.5 w-7 h-7 bg-[#0A1D32] border border-white/20 text-slate-300 hover:text-white hover:border-[#4CAF50] rounded-full items-center justify-center z-50 transition-all hover:scale-110 shadow-lg"
        >
          {isExpanded ? <FiChevronLeft className="w-4 h-4" /> : <FiChevronRight className="w-4 h-4" />}
        </button>

        {/* Header */}
        <div className="h-24 flex items-center px-5 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden w-full">
            <div className="w-10 h-10 bg-linear-to-br from-[#207D86] to-[#4CAF50] rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-[#207D86]/20">
              <span className="font-bold text-white text-lg tracking-wider">S</span>
            </div>
            {isExpanded && (
              <div className="flex flex-col animate-in fade-in duration-300">
                <span className="text-lg font-bold tracking-wide text-white leading-tight">Student</span>
                <span className="text-[10px] font-bold text-[#4CAF50] tracking-widest uppercase">Portal</span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 flex flex-col gap-1.5 overflow-y-auto custom-scrollbar overflow-x-hidden">
          
          {menuItems.map((item) => {
            const hasSubLinks = !!item.subLinks;
            const isActive = hasSubLinks 
              ? (location.pathname.includes(item.basePath) || (item.altBasePath && location.pathname.includes(item.altBasePath)) || item.subLinks.some(link => location.pathname.includes(link.path)))
              : location.pathname.includes(item.path);
            
            const isOpen = openMenus[item.name];

            return (
              <div key={item.name}>
                {hasSubLinks ? (
                  /* Dropdown Parent Button */
                  <button
                    onClick={() => toggleMenu(item.name)}
                    className={`relative flex items-center gap-4 py-3.5 w-full transition-all duration-200 group outline-none
                      ${isExpanded ? "px-5" : "justify-center px-0"}
                      ${isActive ? "bg-linear-to-r from-[#207D86]/20 to-transparent text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"}
                    `}
                  >
                    {isActive && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-linear-to-b from-[#4CAF50] to-[#207D86] rounded-r-full shadow-[0_0_10px_rgba(32,125,134,0.5)]" />}
                    <item.icon className={`w-5 h-5 shrink-0 transition-transform duration-200 ${!isActive && "group-hover:scale-110"} ${isActive ? "text-[#4CAF50]" : "text-slate-400 group-hover:text-[#4CAF50]"}`} />
                    
                    {isExpanded && (
                      <>
                        <span className={`font-medium tracking-wide flex-1 text-left transition-all duration-200 ${!isActive && "group-hover:translate-x-1"}`}>{item.name}</span>
                        {isOpen ? <FiChevronUp className="w-4 h-4 text-slate-400" /> : <FiChevronDown className="w-4 h-4 text-slate-400" />}
                      </>
                    )}
                    
                    {!isExpanded && (
                      <div className="absolute left-full ml-4 px-3 py-2 bg-[#207D86] text-white text-sm font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-xl pointer-events-none before:content-[''] before:absolute before:top-1/2 before:-left-1 before:-translate-y-1/2 before:border-4 before:border-transparent before:border-r-[#207D86]">{item.name}</div>
                    )}
                  </button>
                ) : (
                  /* Standard Single Link */
                  <Link 
                    to={item.path} 
                    onClick={close}
                    className={`relative flex items-center gap-4 py-3.5 transition-all duration-200 group outline-none
                      ${isExpanded ? "px-5" : "justify-center px-0"}
                      ${isActive ? "bg-linear-to-r from-[#207D86]/20 to-transparent text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"}
                    `}
                  >
                    {isActive && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-linear-to-b from-[#4CAF50] to-[#207D86] rounded-r-full shadow-[0_0_10px_rgba(32,125,134,0.5)]" />}
                    <item.icon className={`w-5 h-5 shrink-0 transition-transform duration-200 ${!isActive && "group-hover:scale-110"} ${isActive ? "text-[#4CAF50]" : "text-slate-400 group-hover:text-[#4CAF50]"}`} />
                    {isExpanded && <span className={`font-medium tracking-wide transition-all duration-200 ${!isActive && "group-hover:translate-x-1"}`}>{item.name}</span>}
                    {!isExpanded && (
                      <div className="absolute left-full ml-4 px-3 py-2 bg-[#207D86] text-white text-sm font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-xl pointer-events-none before:content-[''] before:absolute before:top-1/2 before:-left-1 before:-translate-y-1/2 before:border-4 before:border-transparent before:border-r-[#207D86]">
                        {item.name}
                      </div>
                    )}
                  </Link>
                )}

                {/* Sublinks Dropdown Render */}
                {hasSubLinks && isExpanded && isOpen && (
                  <div className="flex flex-col gap-0.5 mt-0.5 animate-in fade-in slide-in-from-top-2 duration-200">
                    {item.subLinks.map((subLink) => {
                      const isSubActive = location.pathname.startsWith(subLink.path);
                      return (
                        <Link key={subLink.name} to={subLink.path} onClick={close}
                          className={`relative flex items-center gap-3 py-2.5 pl-12 pr-5 transition-all duration-200 group outline-none
                            ${isSubActive ? "bg-[#207D86]/15 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"}
                          `}
                        >
                          {isSubActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#4CAF50]/60 rounded-r-full" />}
                          <div className="absolute left-8 top-0 bottom-0 w-px bg-white/5" />
                          <div className={`absolute left-7 top-1/2 w-3 h-px ${isSubActive ? "bg-[#4CAF50]/40" : "bg-white/10"}`} />
                          <subLink.icon className={`w-4 h-4 shrink-0 transition-transform duration-200 ${!isSubActive && "group-hover:scale-110"} ${isSubActive ? "text-[#4CAF50]" : "text-slate-500 group-hover:text-[#4CAF50]"}`} />
                          <span className={`text-sm font-medium tracking-wide transition-all duration-200 ${!isSubActive && "group-hover:translate-x-1"}`}>{subLink.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

        </nav>

        {/* Footer */}
        <div className="flex flex-col shrink-0 border-t border-white/5">
          <div className="p-4">
            <button onClick={handleLogout} className={`relative flex items-center gap-4 py-3 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 group outline-none w-full ${isExpanded ? "px-4" : "justify-center px-0"}`}>
              <FiLogOut className="w-5 h-5 shrink-0 group-hover:scale-110 transition-transform duration-200" />
              {isExpanded && <span className="font-medium tracking-wide transition-all duration-200 group-hover:translate-x-1">Logout</span>}
              {!isExpanded && (
                <div className="absolute left-full ml-4 px-3 py-2 bg-red-500 text-white text-sm font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-xl pointer-events-none before:content-[''] before:absolute before:top-1/2 before:-left-1 before:-translate-y-1/2 before:border-4 before:border-transparent before:border-r-red-500">Logout</div>
              )}
            </button>
          </div>
          <div className="py-4 px-2 bg-black/20 flex justify-center text-center border-t border-white/5">
            {isExpanded ? (
              <p className="text-[10px] sm:text-xs text-slate-500 tracking-wider">
                © {new Date().getFullYear()} <span className="font-semibold text-slate-400">OneX Universe (Pvt) Ltd.</span> <br className="hidden md:block" /> All rights reserved.
              </p>
            ) : (
              <span className="text-xs font-bold text-slate-500 tracking-widest cursor-default" title="© OneX Universe">1X</span>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default StudentSidebar;