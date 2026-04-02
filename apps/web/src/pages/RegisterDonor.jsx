import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  FiUser, FiMail, FiPhone, FiLock, FiMapPin, 
  FiArrowRight, FiCheckCircle, FiLoader, FiAlertCircle 
} from "react-icons/fi";
import userService from "../services/UserService";

// --- FIXED: Component defined OUTSIDE the main component ---
const InputField = ({ label, name, type = "text", placeholder, icon: Icon, onChange, value, required = true }) => (
  <div className="space-y-1.5">
    <label className="text-sm font-semibold text-slate-700 ml-1">{label}</label>
    <div className="relative group">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#207D86] transition-colors">
        <Icon className="w-5 h-5" />
      </div>
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#207D86] focus:ring-4 focus:ring-[#207D86]/10 outline-none transition-all duration-200 placeholder:text-slate-400 text-slate-700 font-medium"
      />
    </div>
  </div>
);

const RegisterDonor = () => {
  const navigate = useNavigate();

  // --- State Management ---
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

  // Handle top-level fields
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError(null);
  };

  // Handle nested address fields
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
    <div className="min-h-screen w-full flex justify-center items-center py-10 px-4 bg-linear-to-br from-[#0E2A47] via-[#207D86] to-[#4CAF50] font-sans">
      
      {/* Decorative Background */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-white/20">
        
        {/* Header Section */}
        <div className="bg-[#0E2A47] p-10 text-center text-white relative overflow-hidden">
           <div className="absolute inset-0 bg-linear-to-r from-[#0E2A47] to-[#207D86] opacity-90"></div>
           <div className="relative z-10">
             <h2 className="text-3xl font-bold mb-2">Join Our Community</h2>
             <p className="text-slate-200">Bridge the gap in education by becoming a donor today.</p>
           </div>
        </div>

        <div className="p-8 md:p-12">
          {/* Success Overlay */}
          {isSuccess ? (
            <div className="text-center py-12 animate-in fade-in zoom-in duration-500">
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <FiCheckCircle className="w-12 h-12" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-2">Registration Successful!</h3>
              <p className="text-slate-500">Your donor profile has been created. Redirecting you to login...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              
              {error && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-3 animate-shake">
                  <FiAlertCircle className="w-5 h-5 shrink-0" />
                  <span className="font-medium">{error}</span>
                </div>
              )}

              {/* Personal Details Section */}
              <div className="space-y-5">
                <h3 className="text-[#0E2A47] font-bold text-lg flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-[#207D86]/10 text-[#207D86] flex items-center justify-center"><FiUser /></span>
                  Personal Details
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <InputField label="First Name" name="firstName" placeholder="John" icon={FiUser} value={formData.firstName} onChange={handleChange} />
                  <InputField label="Last Name" name="lastName" placeholder="Doe" icon={FiUser} value={formData.lastName} onChange={handleChange} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <InputField label="Email Address" name="email" type="email" placeholder="john@example.com" icon={FiMail} value={formData.email} onChange={handleChange} />
                  <InputField label="Phone Number" name="phoneNumber" placeholder="94771234567" icon={FiPhone} value={formData.phoneNumber} onChange={handleChange} />
                </div>

                <InputField label="Password" name="password" type="password" placeholder="••••••••" icon={FiLock} value={formData.password} onChange={handleChange} />
              </div>

              {/* Address Section */}
              <div className="space-y-5">
                <h3 className="text-[#0E2A47] font-bold text-lg flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-[#207D86]/10 text-[#207D86] flex items-center justify-center"><FiMapPin /></span>
                  Address Information
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

              {/* Action Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 px-6 bg-[#0E2A47] hover:bg-[#207D86] text-white text-lg font-bold rounded-2xl shadow-xl shadow-[#0E2A47]/20 transition-all duration-300 flex justify-center items-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed group"
                >
                  {loading ? (
                    <FiLoader className="w-6 h-6 animate-spin" />
                  ) : (
                    <>
                      Complete Registration 
                      <FiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Login Link */}
          {!isSuccess && (
            <div className="mt-10 text-center pt-8 border-t border-slate-100">
              <p className="text-slate-500 font-medium">
                Already part of the community?{" "}
                <Link to="/login" className="text-[#207D86] font-bold hover:underline transition-all">
                  Sign In here
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegisterDonor;