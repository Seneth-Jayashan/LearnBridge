import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { 
  FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight, 
  FiUser, FiHeart, FiBookOpen, FiShield 
} from "react-icons/fi";
import LogoImage from "../assets/Learn Bridge Logo 2.png"; 

const Login = () => {
  const [formData, setFormData] = useState({ identifier: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const { login, loading, error: authError } = useAuth();
  
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/dashboard";

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(formData.identifier, formData.password);
    if (result.success) {
      navigate(from, { replace: true });
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row font-sans text-slate-800 bg-white">
      
      {/* --- Left Side: Brand & Registration Section --- */}
      <div className="relative flex flex-col justify-center items-center w-full md:w-5/12 p-8 md:p-12 overflow-hidden bg-[#0A1D32] text-white">
        {/* Animated Background Mesh */}
        <div className="absolute inset-0 opacity-40">
           <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#207D86] rounded-full blur-[120px] animate-pulse"></div>
           <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#4CAF50] rounded-full blur-[120px] animate-pulse"></div>
        </div>

        <div className="relative z-10 max-w-sm w-full flex flex-col items-center text-center">
          <img src={LogoImage} alt="Logo" className="w-20 h-20 mb-6 rounded-2xl shadow-2xl border border-white/10" />
          <h1 className="text-3xl font-extrabold mb-4 leading-tight">New Here?</h1>
          <p className="text-slate-400 mb-10 text-sm font-medium">Join our mission to transform rural education through community support.</p>

          <div className="flex flex-col gap-4 w-full">
            <Link to="/register-donor" className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white hover:text-[#0A1D32] transition-all duration-300 group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#4CAF50]/20 flex items-center justify-center text-[#4CAF50] group-hover:bg-[#4CAF50] group-hover:text-white transition-colors">
                  <FiHeart className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold uppercase tracking-wider opacity-60">Support</p>
                  <p className="font-bold">As a Donor</p>
                </div>
              </div>
              <FiArrowRight className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
            </Link>

            <Link to="/register-teacher" className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white hover:text-[#0A1D32] transition-all duration-300 group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#207D86]/20 flex items-center justify-center text-[#207D86] group-hover:bg-[#207D86] group-hover:text-white transition-colors">
                  <FiBookOpen className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold uppercase tracking-wider opacity-60">Inspire</p>
                  <p className="font-bold">As a Teacher</p>
                </div>
              </div>
              <FiArrowRight className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
            </Link>
          </div>
        </div>
      </div>

      {/* --- Right Side: The "Attractive" Login Form --- */}
      <div className="flex flex-col justify-center items-center w-full md:w-7/12 p-6 md:p-12 bg-slate-50 relative">
        {/* Subtle background text for design depth */}
        <div className="absolute top-10 right-10 text-[120px] font-black text-slate-200/50 select-none pointer-events-none hidden lg:block">
          LOGIN
        </div>

        <div className="w-full max-w-md relative z-10">
          <div className="mb-10 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#207D86]/10 text-[#207D86] rounded-full text-xs font-bold uppercase tracking-widest mb-4">
              <FiShield className="w-3 h-3" /> Secure Access
            </div>
            <h2 className="text-4xl font-black text-[#0A1D32] tracking-tight mb-2">Welcome Back</h2>
            <p className="text-slate-500 font-medium">Please enter your credentials to access your account.</p>
          </div>

          {authError && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50 border-l-4 border-red-500 text-red-700 text-sm font-bold animate-in fade-in slide-in-from-top-2">
              {authError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Input Wrapper with focus-within shadow effect */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Identity</label>
              <div className="relative flex items-center group">
                <FiUser className="absolute left-4 text-slate-400 group-focus-within:text-[#207D86] transition-colors" />
                <input
                  type="text"
                  name="identifier"
                  placeholder="Email, Phone or Student ID"
                  value={formData.identifier}
                  onChange={handleChange}
                  required
                  className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-100 rounded-2xl outline-none focus:border-[#207D86] focus:shadow-[0_0_20px_rgba(32,125,134,0.1)] transition-all font-semibold text-slate-700"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center ml-1">
                <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">Security Key</label>
                <Link to="/forgot-password" size="sm" className="text-xs font-bold text-[#207D86] hover:text-[#0A1D32] transition-colors">Forgot?</Link>
              </div>
              <div className="relative flex items-center group">
                <FiLock className="absolute left-4 text-slate-400 group-focus-within:text-[#207D86] transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full pl-12 pr-12 py-4 bg-white border-2 border-slate-100 rounded-2xl outline-none focus:border-[#207D86] focus:shadow-[0_0_20px_rgba(32,125,134,0.1)] transition-all font-semibold text-slate-700"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 text-slate-400 hover:text-[#207D86] transition-colors"
                >
                  {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 mt-4 bg-linear-to-r from-[#0A1D32] to-[#207D86] text-white font-bold rounded-2xl shadow-xl shadow-[#207D86]/20 hover:shadow-[#207D86]/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 disabled:opacity-50 flex justify-center items-center gap-3 overflow-hidden group"
            >
              {loading ? (
                <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span className="tracking-wide">Authorize Account</span>
                  <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <p className="mt-10 text-center text-xs text-slate-400 font-bold uppercase tracking-tighter">
            Platform Secured by OneX Universe <br />
            <span className="text-[#207D86]">Terms of Service • Privacy Policy</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;