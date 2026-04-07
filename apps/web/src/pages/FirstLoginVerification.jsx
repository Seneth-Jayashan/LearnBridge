import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  FiKey, FiLock, FiEye, FiEyeOff, FiArrowRight, FiShield, FiCheckCircle
} from "react-icons/fi";
import LogoImage from "../assets/Learn Bridge Logo 2.png"; 

const FirstLoginVerification = () => {
  const { verifyFirstLoginOtp, completeFirstLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get userId passed from the Login route interception
  const userId = location.state?.userId;
  
  const [step, setStep] = useState(1); // 1: OTP, 2: New Password
  const [resetToken, setResetToken] = useState(null);
  
  // Form States
  const [otp, setOtp] = useState("");
  const [passwords, setPasswords] = useState({ newPassword: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  
  // UI States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(location.state?.message || "OTP sent to your email and phone.");

  // Security check: If someone navigates here directly without a userId, kick them back to login
  useEffect(() => {
    if (!userId && step === 1) {
      navigate("/login", { replace: true });
    }
  }, [userId, navigate, step]);

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    const result = await verifyFirstLoginOtp(userId, otp);
    console.log("OTP Verification Result:", result);
    
    if (result.success) {
      setResetToken(result.resetToken);
      setSuccessMsg(result.message);
      setStep(2); // Move to password setup
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (passwords.newPassword !== passwords.confirmPassword) {
      return setError("Passwords do not match.");
    }
    
    if (passwords.newPassword.length < 8) {
      return setError("Password must be at least 8 characters long.");
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    const result = await completeFirstLogin(resetToken, passwords.newPassword);
    
    if (result.success) {
      // Successfully logged in! Navigate to dashboard
      navigate("/dashboard", { replace: true });
    } else {
      setError(result.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex justify-center items-center font-sans bg-slate-50 relative overflow-hidden p-4">
      
      {/* Animated Background Mesh */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-30">
         <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#207D86] rounded-full blur-[150px] animate-pulse"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#0A1D32] rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 w-full max-w-md bg-white p-8 md:p-12 rounded-4xl shadow-2xl shadow-slate-200/50 border border-slate-100">
        
        <div className="flex flex-col items-center text-center mb-8">
          <img src={LogoImage} alt="Logo" className="w-16 h-16 mb-6 rounded-2xl shadow-lg border border-slate-100" />
          
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#207D86]/10 text-[#207D86] rounded-full text-xs font-bold uppercase tracking-widest mb-4">
            <FiShield className="w-3 h-3" /> Account Setup
          </div>
          
          <h2 className="text-3xl font-black text-[#0A1D32] tracking-tight mb-2">
            {step === 1 ? "Verify Identity" : "Secure Account"}
          </h2>
          <p className="text-slate-500 font-medium text-sm">
            {step === 1 
              ? "This is your first time logging in. Please enter the OTP sent to you." 
              : "Great! Now create a secure password for future logins."}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border-l-4 border-red-500 text-red-700 text-sm font-bold animate-in fade-in slide-in-from-top-2">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-green-50 border-l-4 border-green-500 text-green-700 text-sm font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <FiCheckCircle className="w-5 h-5 shrink-0" /> {successMsg}
          </div>
        )}

        {/* --- STEP 1: OTP FORM --- */}
        {step === 1 && (
          <form onSubmit={handleOtpSubmit} className="space-y-5 animate-in slide-in-from-right-4 fade-in duration-300">
            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">One-Time Password</label>
              <div className="relative flex items-center group">
                <FiKey className="absolute left-4 text-slate-400 group-focus-within:text-[#207D86] transition-colors" />
                <input
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  maxLength={6}
                  required
                  className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-100 rounded-2xl outline-none focus:border-[#207D86] focus:shadow-[0_0_20px_rgba(32,125,134,0.1)] transition-all font-bold text-slate-700 tracking-widest text-center"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || otp.length < 4}
              className="w-full py-4 mt-4 bg-linear-to-r from-[#0A1D32] to-[#207D86] text-white font-bold rounded-2xl shadow-xl shadow-[#207D86]/20 hover:shadow-[#207D86]/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 disabled:opacity-50 flex justify-center items-center gap-3 group"
            >
              {loading ? (
                <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Verify Code</span>
                  <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        )}

        {/* --- STEP 2: SETUP PASSWORD FORM --- */}
        {step === 2 && (
          <form onSubmit={handlePasswordSubmit} className="space-y-5 animate-in slide-in-from-right-4 fade-in duration-300">
            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">New Password</label>
              <div className="relative flex items-center group">
                <FiLock className="absolute left-4 text-slate-400 group-focus-within:text-[#207D86] transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={passwords.newPassword}
                  onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})}
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

            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Confirm Password</label>
              <div className="relative flex items-center group">
                <FiLock className="absolute left-4 text-slate-400 group-focus-within:text-[#207D86] transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={passwords.confirmPassword}
                  onChange={(e) => setPasswords({...passwords, confirmPassword: e.target.value})}
                  required
                  className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-100 rounded-2xl outline-none focus:border-[#207D86] focus:shadow-[0_0_20px_rgba(32,125,134,0.1)] transition-all font-semibold text-slate-700"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 mt-4 bg-linear-to-r from-[#4CAF50] to-[#207D86] text-white font-bold rounded-2xl shadow-xl shadow-[#4CAF50]/20 hover:shadow-[#4CAF50]/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 disabled:opacity-50 flex justify-center items-center gap-3 group"
            >
              {loading ? (
                <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Save & Login</span>
                  <FiCheckCircle className="group-hover:scale-110 transition-transform" />
                </>
              )}
            </button>
          </form>
        )}

      </div>
    </div>
  );
};

export default FirstLoginVerification;