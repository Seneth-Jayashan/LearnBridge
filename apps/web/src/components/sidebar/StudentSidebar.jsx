import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { 
  FiHome, FiPlayCircle, FiCheckSquare, FiAward, 
  FiChevronLeft, FiChevronRight, FiLogOut,
  FiChevronDown, FiChevronUp, FiList, FiPlay, FiBarChart2
} from "react-icons/fi";

const StudentSidebar = ({ isOpen, close, isExpanded, setIsExpanded }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const isOnQuizPage = location.pathname.includes("/student/quiz") || 
                       location.pathname.includes("/student/results");
  const [isQuizOpen, setIsQuizOpen] = useState(isOnQuizPage);

  const links = [
    { name: "My Hub",       path: "/student/dashboard",   icon: FiHome },
    { name: "Courses",      path: "/student/courses",     icon: FiPlayCircle },
    { name: "Assignments",  path: "/student/assignments", icon: FiCheckSquare },
    { name: "Achievements", path: "/student/achievements",icon: FiAward },
  ];

  const quizLinks = [
    { name: "Quiz List",   path: "/student/quizzes",  icon: FiList },
    { name: "Take Quiz",   path: "/student/quiz",     icon: FiPlay },
    { name: "My Results",  path: "/student/results",  icon: FiBarChart2 },
  ];

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
    if (isExpanded) setIsQuizOpen(false);
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-[#0E2A47]/60 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={close}
        />
      )}

      <aside className={`fixed top-0 left-0 h-screen bg-[#0A1D32] text-white z-50 transition-all duration-300 ease-in-out flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.15)]
        ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0
        ${isExpanded ? "w-64" : "w-20"}
      `}>

        {/* --- Top Right Floating Toggle Button --- */}
        <button
          onClick={handleToggleExpand}
          className="hidden md:flex absolute top-9 -right-3.5 w-7 h-7 bg-[#0A1D32] border border-white/20 text-slate-300 hover:text-white hover:border-[#4CAF50] rounded-full items-center justify-center z-50 transition-all duration-200 hover:scale-110 shadow-[0_0_10px_rgba(0,0,0,0.3)]"
        >
          {isExpanded ? <FiChevronLeft className="w-4 h-4" /> : <FiChevronRight className="w-4 h-4" />}
        </button>

        {/* --- Logo / Header --- */}
        <div className="h-24 flex items-center px-5 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden w-full">
            <div className="w-10 h-10 bg-gradient-to-br from-[#207D86] to-[#4CAF50] rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-[#207D86]/20">
              <span className="font-bold text-white text-lg">S</span>
            </div>
            {isExpanded && (
              <div className="flex flex-col animate-in fade-in duration-300">
                <span className="text-lg font-bold tracking-wide text-white leading-tight">Student</span>
                <span className="text-xs font-medium text-[#4CAF50] tracking-wider uppercase">Portal</span>
              </div>
            )}
          </div>
        </div>

        {/* --- Nav Links --- */}
        <nav className="flex-1 py-6 flex flex-col gap-1.5 overflow-y-auto custom-scrollbar overflow-x-hidden">

          {/* Regular links */}
          {links.map((link) => {
            const isActive = location.pathname.includes(link.path);
            return (
              <Link
                key={link.name}
                to={link.path}
                onClick={close}
                className={`relative flex items-center gap-4 py-3.5 transition-all duration-200 group outline-none
                  ${isExpanded ? "px-5" : "justify-center px-0"}
                  ${isActive
                    ? "bg-gradient-to-r from-[#207D86]/20 to-transparent text-white"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"}
                `}
              >
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-[#4CAF50] to-[#207D86] rounded-r-full shadow-[0_0_10px_rgba(32,125,134,0.5)]" />
                )}
                <link.icon className={`w-5 h-5 shrink-0 transition-transform duration-200
                  ${!isActive && "group-hover:scale-110"}
                  ${isActive ? "text-[#4CAF50]" : "text-slate-400 group-hover:text-[#4CAF50]"}`}
                />
                {isExpanded && (
                  <span className={`font-medium tracking-wide transition-all duration-200 ${!isActive && "group-hover:translate-x-1"}`}>
                    {link.name}
                  </span>
                )}
                {!isExpanded && (
                  <div className="absolute left-full ml-4 px-3 py-2 bg-[#207D86] text-white text-sm font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-xl shadow-black/20 pointer-events-none before:content-[''] before:absolute before:top-1/2 before:-left-1 before:-translate-y-1/2 before:border-4 before:border-transparent before:border-r-[#207D86]">
                    {link.name}
                  </div>
                )}
              </Link>
            );
          })}

          {/* ── Quiz Dropdown ─────────────────────────────────────── */}
          <div>
            {/* Dropdown trigger */}
            <button
              onClick={() => isExpanded && setIsQuizOpen((prev) => !prev)}
              className={`relative flex items-center gap-4 py-3.5 w-full transition-all duration-200 group outline-none
                ${isExpanded ? "px-5" : "justify-center px-0"}
                ${isOnQuizPage
                  ? "bg-gradient-to-r from-[#207D86]/20 to-transparent text-white"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"}
              `}
            >
              {isOnQuizPage && (
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-[#4CAF50] to-[#207D86] rounded-r-full shadow-[0_0_10px_rgba(32,125,134,0.5)]" />
              )}

              <FiCheckSquare className={`w-5 h-5 shrink-0 transition-transform duration-200
                ${!isOnQuizPage && "group-hover:scale-110"}
                ${isOnQuizPage ? "text-[#4CAF50]" : "text-slate-400 group-hover:text-[#4CAF50]"}`}
              />

              {isExpanded && (
                <>
                  <span className={`font-medium tracking-wide flex-1 text-left transition-all duration-200 ${!isOnQuizPage && "group-hover:translate-x-1"}`}>
                    Quizzes
                  </span>
                  {isQuizOpen
                    ? <FiChevronUp className="w-4 h-4 text-slate-400" />
                    : <FiChevronDown className="w-4 h-4 text-slate-400" />
                  }
                </>
              )}

              {/* Collapsed tooltip */}
              {!isExpanded && (
                <div className="absolute left-full ml-4 px-3 py-2 bg-[#207D86] text-white text-sm font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-xl shadow-black/20 pointer-events-none before:content-[''] before:absolute before:top-1/2 before:-left-1 before:-translate-y-1/2 before:border-4 before:border-transparent before:border-r-[#207D86]">
                  Quizzes
                </div>
              )}
            </button>

            {/* Dropdown items */}
            {isExpanded && isQuizOpen && (
              <div className="flex flex-col gap-0.5 mt-0.5 animate-in fade-in slide-in-from-top-2 duration-200">
                {quizLinks.map((link) => {
                  const isActive = location.pathname.startsWith(link.path);
                  return (
                    <Link
                      key={link.name}
                      to={link.path}
                      onClick={close}
                      className={`relative flex items-center gap-3 py-2.5 pl-12 pr-5 transition-all duration-200 group outline-none
                        ${isActive
                          ? "bg-[#207D86]/15 text-white"
                          : "text-slate-400 hover:bg-white/5 hover:text-white"}
                      `}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#4CAF50]/60 rounded-r-full" />
                      )}

                      {/* Connecting line decoration */}
                      <div className="absolute left-8 top-0 bottom-0 w-px bg-white/5" />
                      <div className={`absolute left-7 top-1/2 w-3 h-px ${isActive ? "bg-[#4CAF50]/40" : "bg-white/10"}`} />

                      <link.icon className={`w-4 h-4 shrink-0 transition-transform duration-200
                        ${!isActive && "group-hover:scale-110"}
                        ${isActive ? "text-[#4CAF50]" : "text-slate-500 group-hover:text-[#4CAF50]"}`}
                      />
                      <span className={`text-sm font-medium tracking-wide transition-all duration-200 ${!isActive && "group-hover:translate-x-1"}`}>
                        {link.name}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
          {/* ── End Quiz Dropdown ──────────────────────────────────── */}

        </nav>

        {/* --- Footer --- */}
        <div className="flex flex-col shrink-0 border-t border-white/5">
          <div className="p-4">
            <button
              onClick={handleLogout}
              className={`relative flex items-center gap-4 py-3 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 group outline-none w-full
                ${isExpanded ? "px-4" : "justify-center px-0"}`}
            >
              <FiLogOut className="w-5 h-5 shrink-0 group-hover:scale-110 transition-transform duration-200" />
              {isExpanded && (
                <span className="font-medium tracking-wide transition-all duration-200 group-hover:translate-x-1">Logout</span>
              )}
              {!isExpanded && (
                <div className="absolute left-full ml-4 px-3 py-2 bg-red-500 text-white text-sm font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-xl shadow-red-500/20 pointer-events-none before:content-[''] before:absolute before:top-1/2 before:-left-1 before:-translate-y-1/2 before:border-4 before:border-transparent before:border-r-red-500">
                  Logout
                </div>
              )}
            </button>
          </div>

          <div className="py-4 px-2 bg-black/20 flex justify-center text-center border-t border-white/5">
            {isExpanded ? (
              <p className="text-[10px] sm:text-xs text-slate-500 tracking-wider">
                © {new Date().getFullYear()}{" "}
                <span className="font-semibold text-slate-400">OneX Universe (Pvt) Ltd.</span>{" "}
                <br className="hidden md:block" /> All rights reserved.
              </p>
            ) : (
              <span className="text-xs font-bold text-slate-500 tracking-widest cursor-default" title="© OneX Universe">
                1X
              </span>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default StudentSidebar;