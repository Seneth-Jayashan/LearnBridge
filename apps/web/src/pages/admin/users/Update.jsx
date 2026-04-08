import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import adminService from "../../../services/AdminService"; 
import { 
  FiArrowLeft, FiUser, FiMail, FiPhone, 
  FiSave, FiCheckCircle, FiAlertCircle, FiShield 
} from "react-icons/fi";

const Update = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // --- State ---
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    role: "student",
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // --- Load User Data ---
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await adminService.getUserById(id);
        setFormData({
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          email: user.email || "",
          phoneNumber: user.phoneNumber || "",
          role: user.role || "student",
        });
      } catch (err) {
        setMessage({ 
          type: "error", 
          text: err.response?.data?.message || "Failed to load user data." 
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchUser();
  }, [id]);

  // --- Handlers ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage({ type: "", text: "" });

    try {
      await adminService.updateUser(id, formData);
      setMessage({ type: "success", text: "User updated successfully!" });
      
      // Redirect back to users list after a short delay
      setTimeout(() => {
        navigate("/admin/users");
      }, 1500);

    } catch (err) {
      setMessage({ 
        type: "error", 
        text: err.response?.data?.message || "Failed to update user." 
      });
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-[#207D86]"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="mb-8">
        <Link 
          to="/admin/users" 
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-[#207D86] transition-colors mb-4"
        >
          <FiArrowLeft /> Back to Users
        </Link>
        <h1 className="text-3xl font-bold text-slate-800">Edit User</h1>
        <p className="text-slate-500 mt-1">Update account details and role permissions.</p>
      </div>

      {/* Success/Error Message */}
      {message.text && (
        <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-sm font-medium border ${
          message.type === "success" 
            ? "bg-green-50 text-green-700 border-green-200" 
            : "bg-red-50 text-red-700 border-red-200"
        }`}>
          {message.type === "success" ? <FiCheckCircle className="w-5 h-5 shrink-0" /> : <FiAlertCircle className="w-5 h-5 shrink-0" />}
          {message.text}
        </div>
      )}

      {/* Main Form Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8">
          
          {/* --- Personal Details --- */}
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-5">
              <div className="p-2 bg-[#207D86]/10 rounded-lg text-[#207D86]">
                <FiUser className="w-5 h-5" />
              </div>
              Personal Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">First Name</label>
                <input 
                  type="text" name="firstName" value={formData.firstName} onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-50/50 focus:bg-white rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#207D86]/20 focus:border-[#207D86] transition-all outline-none text-slate-700"
                  placeholder="John" required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Last Name</label>
                <input 
                  type="text" name="lastName" value={formData.lastName} onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-50/50 focus:bg-white rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#207D86]/20 focus:border-[#207D86] transition-all outline-none text-slate-700"
                  placeholder="Doe" required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FiMail className="text-slate-400 w-5 h-5" />
                  </div>
                  <input 
                    type="email" name="email" value={formData.email} onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50/50 focus:bg-white rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#207D86]/20 focus:border-[#207D86] transition-all outline-none text-slate-700"
                    placeholder="john@example.com" required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Phone Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FiPhone className="text-slate-400 w-5 h-5" />
                  </div>
                  <input 
                    type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50/50 focus:bg-white rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#207D86]/20 focus:border-[#207D86] transition-all outline-none text-slate-700"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* --- Role & Permissions --- */}
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-5">
              <div className="p-2 bg-[#207D86]/10 rounded-lg text-[#207D86]">
                <FiShield className="w-5 h-5" />
              </div>
              Role & Permissions
            </h3>
            
            <div className="md:w-1/2">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Account Role</label>
              <select 
                name="role" 
                value={formData.role} 
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-50/50 focus:bg-white rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#207D86]/20 focus:border-[#207D86] transition-all outline-none text-slate-700 cursor-pointer"
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="school_admin">School Admin</option>
                <option value="super_admin">Super Admin</option>
                <option value="donor">Donor</option>
              </select>
            </div>
          </div>

          {/* --- Submit Button --- */}
          <div className="flex justify-end pt-6 border-t border-slate-100">
            <button 
              type="submit" 
              disabled={isSaving}
              className="flex items-center gap-2 bg-[#207D86] hover:bg-[#186269] text-white px-8 py-3 rounded-xl font-medium transition-colors shadow-lg shadow-[#207D86]/30 shrink-0 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <FiSave className="w-5 h-5" />
              )}
              <span>{isSaving ? "Saving..." : "Save Changes"}</span>
            </button>
          </div>
          
        </form>
      </div>
    </div>
  );
};

export default Update;