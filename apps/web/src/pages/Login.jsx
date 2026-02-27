import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight, FiUser } from "react-icons/fi";
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
    <div className="min-h-screen w-full flex flex-col md:flex-row font-sans text-slate-800">
      
      {/* --- Left Side: Brand Section (Gradient) --- */}
      <div className="relative flex flex-col justify-center items-center w-full md:w-1/2 p-10 overflow-hidden bg-linear-to-br from-[#0E2A47] via-[#207D86] to-[#4CAF50] text-white text-center">
        
        {/* Decorative Background Circles */}
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-white/10 blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-white/10 blur-3xl"></div>

        {/* Brand Content */}
        <div className="relative z-10 max-w-md flex flex-col items-center">
          <img 
            src={LogoImage} 
            alt="LearnBridge Logo" 
            className="w-40 h-auto mb-8 rounded-2xl shadow-2xl border-4 border-white/20 backdrop-blur-sm"
          />
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight tracking-tight">
            Bridging the Gap to Knowledge.
          </h1>
          <p className="text-lg text-slate-100 font-light opacity-90">
            Empowering rural education through technology and community support.
          </p>
        </div>
      </div>

      {/* --- Right Side: Login Form --- */}
      <div className="flex flex-col justify-center items-center w-full md:w-1/2 bg-slate-50 p-6 md:p-12">
        <div className="w-full max-w-md bg-white p-8 md:p-10 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100">
          
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-[#0E2A47] mb-2">Welcome Back!</h2>
            <p className="text-slate-500">Please enter your details to sign in.</p>
          </div>

          {authError && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm text-center font-medium">
              {authError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Identifier Input */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 ml-1">
                Email, Phone, or Student ID
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#207D86] transition-colors">
                  <FiUser className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  name="identifier"
                  placeholder="e.g., STU0001 or teacher@email.com"
                  value={formData.identifier}
                  onChange={handleChange}
                  required
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#207D86] focus:ring-4 focus:ring-[#207D86]/10 outline-none transition-all duration-200 placeholder:text-slate-400 text-slate-700 font-medium"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-sm font-semibold text-slate-700">Password</label>
                <button type="button" className="text-xs font-medium text-[#207D86] hover:text-[#0E2A47] transition-colors">
                  Forgot Password?
                </button>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#207D86] transition-colors">
                  <FiLock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#207D86] focus:ring-4 focus:ring-[#207D86]/10 outline-none transition-all duration-200 placeholder:text-slate-400 text-slate-700 font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-[#207D86] cursor-pointer transition-colors"
                >
                  {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-linear-to-r from-[#0E2A47] to-[#207D86] hover:from-[#091E33] hover:to-[#18646C] text-white text-lg font-bold rounded-xl shadow-lg shadow-[#207D86]/20 hover:shadow-xl hover:scale-[1.01] active:scale-[0.98] transition-all duration-200 flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  Sign In <FiArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-slate-500 text-sm">
              Don't have an account?{" "}
              <Link 
                to="/register-donor" 
                className="text-[#207D86] font-bold hover:text-[#0E2A47] relative after:content-[''] after:absolute after:-bottom-0.5 after:left-0 after:w-0 after:h-0.5 after:bg-current after:transition-all hover:after:w-full"
              >
                Become a Donor
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;