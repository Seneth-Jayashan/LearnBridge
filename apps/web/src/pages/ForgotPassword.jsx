import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import authService from "../services/AuthService";
import { FiMail, FiArrowLeft, FiAlertCircle, FiCheckCircle } from "react-icons/fi";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: "", text: "" });

    try {
      await authService.forgotPassword(identifier);
      
      // Pass the identifier to the reset page via router state
      navigate("/reset-password", { state: { identifier } });
    } catch (error) {
      setMessage({ 
        type: "error", 
        text: error.response?.data?.message || "Failed to send reset code. Please try again." 
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
        
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#207D86]/10 text-[#207D86] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FiMail className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Forgot Password?</h2>
          <p className="text-slate-500 mt-2 text-sm">
            Enter your email or registration number and we'll send you an OTP to reset your password.
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

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Email or Reg Number</label>
            <div className="relative">
              <input 
                type="text" 
                value={identifier} 
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 focus:bg-white rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#207D86]/20 focus:border-[#207D86] transition-all outline-none text-slate-700"
                placeholder="Enter your identifier" 
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading || !identifier.trim()}
            className="w-full flex justify-center items-center gap-2 bg-[#207D86] hover:bg-[#186269] text-white px-4 py-3 rounded-xl font-medium transition-colors shadow-lg shadow-[#207D86]/30 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              "Send Reset Code"
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

export default ForgotPassword;