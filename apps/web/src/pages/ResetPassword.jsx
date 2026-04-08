import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import authService from "../services/AuthService";
import { FiLock, FiKey, FiArrowLeft, FiAlertCircle, FiCheckCircle } from "react-icons/fi";

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Extract identifier passed from ForgotPassword route
  const identifier = location.state?.identifier || "";

  const [formData, setFormData] = useState({
    otp: "",
    newPassword: "",
    confirmPassword: ""
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Redirect back if accessed directly without an identifier
  useEffect(() => {
    if (!identifier) {
      navigate("/forgot-password");
    }
  }, [identifier, navigate]);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match." });
      return;
    }

    setIsLoading(true);
    setMessage({ type: "", text: "" });

    try {
      await authService.resetPassword(identifier, formData.otp, formData.newPassword);
      setMessage({ type: "success", text: "Password reset successfully! Redirecting to login..." });
      
      // Delay redirection slightly so user can read the success message
      setTimeout(() => {
        navigate("/login");
      }, 2500);

    } catch (error) {
      setMessage({ 
        type: "error", 
        text: error.response?.data?.message || "Failed to reset password. Invalid OTP or request expired." 
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
        
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#207D86]/10 text-[#207D86] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FiLock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Set New Password</h2>
          <p className="text-slate-500 mt-2 text-sm">
            We sent a verification code to <span className="font-semibold">{identifier}</span>.
          </p>
        </div>

        {message.text && (
          <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-sm font-medium border ${
            message.type === "success" ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"
          }`}>
            {message.type === "success" ? <FiCheckCircle className="w-5 h-5 shrink-0" /> : <FiAlertCircle className="w-5 h-5 shrink-0" />}
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Verification Code (OTP)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <FiKey className="text-slate-400 w-5 h-5" />
              </div>
              <input 
                type="text" 
                name="otp"
                value={formData.otp} 
                onChange={handleChange}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 focus:bg-white rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#207D86]/20 focus:border-[#207D86] transition-all outline-none text-slate-700 tracking-widest font-mono"
                placeholder="123456" 
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">New Password</label>
            <input 
              type="password" 
              name="newPassword"
              value={formData.newPassword} 
              onChange={handleChange}
              className="w-full px-4 py-3 bg-slate-50 focus:bg-white rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#207D86]/20 focus:border-[#207D86] transition-all outline-none text-slate-700"
              placeholder="••••••••" 
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Confirm New Password</label>
            <input 
              type="password" 
              name="confirmPassword"
              value={formData.confirmPassword} 
              onChange={handleChange}
              className="w-full px-4 py-3 bg-slate-50 focus:bg-white rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#207D86]/20 focus:border-[#207D86] transition-all outline-none text-slate-700"
              placeholder="••••••••" 
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading || !formData.otp || !formData.newPassword}
            className="w-full flex justify-center items-center gap-2 mt-2 bg-[#207D86] hover:bg-[#186269] text-white px-4 py-3 rounded-xl font-medium transition-colors shadow-lg shadow-[#207D86]/30 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              "Reset Password"
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <Link to="/login" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-[#207D86] transition-colors">
            <FiArrowLeft /> Back to Login
          </Link>
        </div>

      </div>
    </div>
  );
};

export default ResetPassword;