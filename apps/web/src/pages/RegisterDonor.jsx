import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { FiUser, FiMail, FiPhone, FiLock, FiMapPin, FiArrowRight, FiCheckCircle } from "react-icons/fi";

const RegisterDonor = () => {
  const { registerDonor, loading, error: authError } = useAuth();
  const navigate = useNavigate();

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
      country: ""
    }
  });

  // Handle top-level fields
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
    const result = await registerDonor(formData);
    if (result.success) {
      alert("Registration successful! Please login.");
      navigate("/login");
    }
  };

  // Reusable Input Component to keep code clean
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

  return (
    <div className="min-h-screen w-full flex justify-center items-center py-10 px-4 bg-gradient-to-br from-[#0E2A47] via-[#207D86] to-[#4CAF50] font-sans">
      
      {/* Decorative Background Elements */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl shadow-black/20 overflow-hidden">
        
        {/* Header Section */}
        <div className="bg-[#0E2A47] p-8 text-center text-white relative overflow-hidden">
           <div className="absolute inset-0 bg-gradient-to-r from-[#0E2A47] to-[#207D86] opacity-90"></div>
           <div className="relative z-10">
             <h2 className="text-3xl font-bold mb-2">Join Our Community</h2>
             <p className="text-slate-200">Become a donor and help bridge the gap in rural education.</p>
           </div>
        </div>

        <div className="p-8 md:p-10">
          {authError && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-2">
              <span className="font-bold">Error:</span> {authError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* --- Personal Details Section --- */}
            <div className="space-y-4">
              <h3 className="text-[#0E2A47] font-bold text-lg border-b border-slate-100 pb-2 mb-4 flex items-center gap-2">
                <FiUser className="text-[#207D86]" /> Personal Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField label="First Name" name="firstName" placeholder="John" icon={FiUser} value={formData.firstName} onChange={handleChange} />
                <InputField label="Last Name" name="lastName" placeholder="Doe" icon={FiUser} value={formData.lastName} onChange={handleChange} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField label="Email Address" name="email" type="email" placeholder="john@example.com" icon={FiMail} value={formData.email} onChange={handleChange} />
                <InputField label="Phone Number" name="phoneNumber" placeholder="94771234567" icon={FiPhone} value={formData.phoneNumber} onChange={handleChange} />
              </div>

              <InputField label="Password" name="password" type="password" placeholder="Create a strong password" icon={FiLock} value={formData.password} onChange={handleChange} />
            </div>

            {/* --- Address Section --- */}
            <div className="space-y-4 pt-4">
              <h3 className="text-[#0E2A47] font-bold text-lg border-b border-slate-100 pb-2 mb-4 flex items-center gap-2">
                <FiMapPin className="text-[#207D86]" /> Address
              </h3>

              <InputField label="Street Address" name="street" placeholder="123 Main St" icon={FiMapPin} value={formData.address.street} onChange={handleAddressChange} required={false} />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField label="City" name="city" placeholder="Colombo" icon={FiMapPin} value={formData.address.city} onChange={handleAddressChange} required={false} />
                <InputField label="State / Province" name="state" placeholder="Western" icon={FiMapPin} value={formData.address.state} onChange={handleAddressChange} required={false} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField label="Zip Code" name="zipCode" placeholder="10100" icon={FiMapPin} value={formData.address.zipCode} onChange={handleAddressChange} required={false} />
                <InputField label="Country" name="country" placeholder="Sri Lanka" icon={FiMapPin} value={formData.address.country} onChange={handleAddressChange} required={false} />
              </div>
            </div>

            {/* --- Submit Button --- */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 bg-gradient-to-r from-[#0E2A47] to-[#207D86] hover:from-[#091E33] hover:to-[#18646C] text-white text-lg font-bold rounded-xl shadow-lg shadow-[#207D86]/20 hover:shadow-xl hover:scale-[1.01] active:scale-[0.98] transition-all duration-200 flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span>Creating Account...</span>
                ) : (
                  <>
                    Complete Registration <FiCheckCircle className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center pt-6 border-t border-slate-100">
            <p className="text-slate-500 text-sm">
              Already have an account?{" "}
              <Link 
                to="/login" 
                className="text-[#207D86] font-bold hover:text-[#0E2A47] transition-colors inline-flex items-center gap-1"
              >
                Sign In <FiArrowRight className="w-4 h-4" />
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterDonor;