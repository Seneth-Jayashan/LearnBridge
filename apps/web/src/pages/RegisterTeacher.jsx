import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  FiUser, FiMail, FiPhone, FiLock, FiBookOpen, 
  FiArrowRight, FiCheckCircle, FiLoader, FiAlertCircle, FiSearch 
} from "react-icons/fi";
import userService from "../services/UserService";

const RegisterTeacher = () => {
  const navigate = useNavigate();

  // --- State Management ---
  const [loading, setLoading] = useState(false);
  const [schoolsLoading, setSchoolsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [schools, setSchools] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    password: "",
    schoolId: "" // Empty means "Standalone"
  });

  // Fetch verified schools for the dropdown
  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const data = await userService.getPublicSchools();
        // Only show active schools
        setSchools(data.filter(s => s.isActive));
      } catch (err) {
        console.error("Failed to load schools");
      } finally {
        setSchoolsLoading(false);
      }
    };
    fetchSchools();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await userService.registerTeacher(formData);
      setIsSuccess(true);
      setTimeout(() => navigate("/login"), 4000);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const filteredSchools = schools.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen w-full flex justify-center items-center py-10 px-4 bg-linear-to-br from-[#0A1D32] via-[#0E2A47] to-[#207D86] font-sans">
      
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-white/20">
        
        {/* Header Section */}
        <div className="bg-[#0A1D32] p-10 text-center text-white relative overflow-hidden">
           <div className="absolute inset-0 bg-linear-to-r from-[#0A1D32] to-[#207D86] opacity-90"></div>
           <div className="relative z-10">
             <h2 className="text-3xl font-bold mb-2">Educator Registration</h2>
             <p className="text-slate-200 text-sm">Join the network of teachers empowering rural Sri Lanka.</p>
           </div>
        </div>

        <div className="p-8 md:p-12">
          {isSuccess ? (
            <div className="text-center py-12 animate-in fade-in zoom-in duration-500">
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <FiCheckCircle className="w-12 h-12" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-2">Registration Received!</h3>
              <p className="text-slate-500 max-w-md mx-auto">
                {formData.schoolId 
                  ? "Since you selected a school, your profile is pending School Admin verification. You can login once approved."
                  : "Standalone profile created. Redirecting to login..."}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {error && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-3 animate-shake">
                  <FiAlertCircle className="w-5 h-5 shrink-0" />
                  <span className="font-medium">{error}</span>
                </div>
              )}

              {/* Identity Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 ml-1">First Name</label>
                  <div className="relative">
                    <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input required name="firstName" value={formData.firstName} onChange={handleChange} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-[#207D86]/10 outline-none transition-all" placeholder="John" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 ml-1">Last Name</label>
                  <div className="relative">
                    <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input required name="lastName" value={formData.lastName} onChange={handleChange} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-[#207D86]/10 outline-none transition-all" placeholder="Doe" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 ml-1">Email Address</label>
                  <div className="relative">
                    <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-[#207D86]/10 outline-none transition-all" placeholder="teacher@example.com" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 ml-1">Phone Number</label>
                  <div className="relative">
                    <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input required name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-[#207D86]/10 outline-none transition-all" placeholder="94771234567" />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700 ml-1">Password</label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input required type="password" name="password" value={formData.password} onChange={handleChange} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-[#207D86]/10 outline-none transition-all" placeholder="••••••••" />
                </div>
              </div>

              {/* School Affiliation Section */}
              <div className="space-y-3 pt-2">
                <label className="text-sm font-bold text-slate-700 ml-1 flex items-center gap-2">
                  <FiBookOpen className="text-[#207D86]" /> School Affiliation
                </label>
                
                <div className="p-5 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                  <p className="text-xs text-slate-500 mb-4 font-medium">
                    Search for your school below. If your school is not listed, leave it blank to register as a standalone teacher.
                  </p>
                  
                  <div className="relative mb-3">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Search school by name..." 
                      className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg outline-none focus:border-[#207D86]"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <select 
                    name="schoolId"
                    value={formData.schoolId}
                    onChange={handleChange}
                    className="w-full p-2.5 text-sm bg-white border border-slate-200 rounded-lg outline-none cursor-pointer focus:border-[#207D86]"
                  >
                    <option value="">I am a Standalone Teacher</option>
                    {filteredSchools.map(school => (
                      <option key={school._id} value={school._id}>
                        {school.name} - {school.address?.city}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 px-6 bg-[#0A1D32] hover:bg-[#207D86] text-white text-lg font-bold rounded-2xl shadow-xl shadow-[#0A1D32]/20 transition-all duration-300 flex justify-center items-center gap-3 disabled:opacity-70 group"
                >
                  {loading ? <FiLoader className="w-6 h-6 animate-spin" /> : <>Register as Teacher <FiArrowRight className="group-hover:translate-x-1 transition-transform" /></>}
                </button>
              </div>
            </form>
          )}

          {!isSuccess && (
            <div className="mt-8 text-center pt-6 border-t border-slate-100">
              <p className="text-slate-500 font-medium text-sm">
                Already have an account? <Link to="/login" className="text-[#207D86] font-bold hover:underline">Sign In</Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegisterTeacher;