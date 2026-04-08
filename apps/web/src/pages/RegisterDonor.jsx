import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  FiUser, FiMail, FiPhone, FiLock, FiMapPin, 
  FiArrowRight, FiCheckCircle, FiAlertCircle, FiHeart, FiBookOpen 
} from "react-icons/fi";
import LogoImage from "../assets/Learn Bridge Logo 2.png";
import userService from "../services/UserService";

// Reusable Input Component matched to Login style
const InputField = ({ label, name, type = "text", placeholder, icon: Icon, onChange, value, required = true }) => (
  <div className="space-y-1.5 w-full">
    <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    <div className="relative flex items-center group">
      <Icon className="absolute left-4 text-slate-400 group-focus-within:text-[#207D86] transition-colors z-10" />
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-slate-100 rounded-2xl outline-none focus:border-[#207D86] focus:shadow-[0_0_20px_rgba(32,125,134,0.1)] transition-all font-semibold text-slate-700"
      />
    </div>
  </div>
);

const RegisterDonor = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    password: "",
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "Sri Lanka"
    }
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError(null);
  };

  const handleAddressChange = (e) => {
    setFormData({
      ...formData,
      address: { ...formData.address, [e.target.name]: e.target.value }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await userService.registerDonor(formData);
      setIsSuccess(true);
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row font-sans text-slate-800 bg-white">
      
      {/* --- Left Side: Brand Panel --- */}
      <div className="relative flex flex-col justify-center items-center w-full md:w-5/12 p-8 md:p-12 overflow-hidden bg-[#0A1D32] text-white">
        {/* Animated Background Mesh */}
        <div className="absolute inset-0 opacity-40">
           <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#4CAF50] rounded-full blur-[120px] animate-pulse"></div>
           <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#207D86] rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="relative z-10 max-w-sm w-full flex flex-col items-center text-center">
          <img src={LogoImage} alt="Logo" className="w-20 h-20 mb-6 rounded-2xl shadow-2xl border border-white/10" />
          <h1 className="text-3xl font-extrabold mb-4 leading-tight">Become a Catalyst</h1>
          <p className="text-slate-400 mb-10 text-sm font-medium leading-relaxed">
            Your support provides essential resources to students in need. Bridge the gap in education and empower communities today.
          </p>

          <div className="flex flex-col gap-4 w-full">
            <Link to="/login" className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white hover:text-[#0A1D32] transition-all duration-300 group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-500/20 flex items-center justify-center text-slate-300 group-hover:bg-slate-100 group-hover:text-[#0A1D32] transition-colors">
                  <FiUser className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold uppercase tracking-wider opacity-60">Already Registered?</p>
                  <p className="font-bold">Sign In Here</p>
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
                  <p className="text-xs font-bold uppercase tracking-wider opacity-60">Want to help differently?</p>
                  <p className="font-bold">Register as a Teacher</p>
                </div>
              </div>
              <FiArrowRight className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
            </Link>
          </div>
        </div>
      </div>

      {/* --- Right Side: Form Panel --- */}
      <div className="flex flex-col justify-center items-center w-full md:w-7/12 p-6 md:p-12 bg-slate-50 relative overflow-y-auto">
        {/* Subtle background text */}
        <div className="absolute top-10 right-10 text-[100px] font-black text-slate-200/50 select-none pointer-events-none hidden lg:block z-0">
          DONOR
        </div>

        <div className="w-full max-w-xl relative z-10 py-10">
          {isSuccess ? (
            <div className="text-center py-16 animate-in fade-in zoom-in duration-500 bg-white p-10 rounded-3xl shadow-xl border border-slate-100">
              <div className="w-24 h-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 border-8 border-green-100/50">
                <FiCheckCircle className="w-12 h-12" />
              </div>
              <h3 className="text-3xl font-black text-[#0A1D32] mb-4">Registration Successful!</h3>
              <p className="text-slate-500 text-lg max-w-md mx-auto">
                Your donor profile has been created. Redirecting you to the login page...
              </p>
            </div>
          ) : (
            <>
              <div className="mb-10 text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#4CAF50]/10 text-[#4CAF50] rounded-full text-xs font-bold uppercase tracking-widest mb-4">
                  <FiHeart className="w-3 h-3" /> Supporter Portal
                </div>
                <h2 className="text-4xl font-black text-[#0A1D32] tracking-tight mb-2">Create Profile</h2>
                <p className="text-slate-500 font-medium">Please fill in your details to register as a donor.</p>
              </div>

              {error && (
                <div className="mb-8 p-4 rounded-2xl bg-red-50 border-l-4 border-red-500 text-red-700 text-sm font-bold animate-in fade-in slide-in-from-top-2 flex items-center gap-3">
                  <FiAlertCircle className="w-5 h-5 shrink-0" />
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Section 1: Personal */}
                <div className="space-y-5">
                  <h3 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-2">
                    1. Personal Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <InputField label="First Name" name="firstName" placeholder="John" icon={FiUser} value={formData.firstName} onChange={handleChange} />
                    <InputField label="Last Name" name="lastName" placeholder="Doe" icon={FiUser} value={formData.lastName} onChange={handleChange} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <InputField label="Email Address" name="email" type="email" placeholder="john@example.com" icon={FiMail} value={formData.email} onChange={handleChange} />
                    <InputField label="Phone Number" name="phoneNumber" type="tel" placeholder="94771234567" icon={FiPhone} value={formData.phoneNumber} onChange={handleChange} />
                  </div>
                  <InputField label="Password" name="password" type="password" placeholder="••••••••" icon={FiLock} value={formData.password} onChange={handleChange} />
                </div>

                {/* Section 2: Address */}
                <div className="space-y-5 pt-4">
                  <h3 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-2">
                    2. Address Information (Optional)
                  </h3>
                  <InputField label="Street Address" name="street" placeholder="123 Main St" icon={FiMapPin} value={formData.address.street} onChange={handleAddressChange} required={false} />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <InputField label="City" name="city" placeholder="Colombo" icon={FiMapPin} value={formData.address.city} onChange={handleAddressChange} required={false} />
                    <InputField label="State / Province" name="state" placeholder="Western" icon={FiMapPin} value={formData.address.state} onChange={handleAddressChange} required={false} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <InputField label="Zip Code" name="zipCode" placeholder="10100" icon={FiMapPin} value={formData.address.zipCode} onChange={handleAddressChange} required={false} />
                    <InputField label="Country" name="country" placeholder="Sri Lanka" icon={FiMapPin} value={formData.address.country} onChange={handleAddressChange} required={false} />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 mt-6 bg-linear-to-r from-[#0A1D32] to-[#207D86] text-white font-bold rounded-2xl shadow-xl shadow-[#207D86]/20 hover:shadow-[#207D86]/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 disabled:opacity-50 flex justify-center items-center gap-3 overflow-hidden group"
                >
                  {loading ? (
                    <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span className="tracking-wide">Complete Registration</span>
                      <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            </>
          )}

          <p className="mt-10 text-center text-xs text-slate-400 font-bold uppercase tracking-tighter">
            Platform Secured by OneX Universe <br />
            <span className="text-[#207D86]">Terms of Service • Privacy Policy</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterDonor;