import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import adminService from "../../../services/AdminService";
import { FiArrowLeft, FiCheck } from "react-icons/fi";

const CreateSchool = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    // School Data
    schoolName: "",
    schoolEmail: "",
    schoolPhone: "",
    street: "",
    city: "",
    state: "",
    // Admin Data
    adminFirstName: "",
    adminLastName: "",
    adminEmail: "",
    adminPhone: "",
    adminPassword: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Format payload exactly how backend expects it
    const payload = {
      schoolData: {
        name: formData.schoolName,
        contactEmail: formData.schoolEmail,
        contactPhone: formData.schoolPhone,
        address: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
        }
      },
      adminData: {
        firstName: formData.adminFirstName,
        lastName: formData.adminLastName,
        email: formData.adminEmail,
        phoneNumber: formData.adminPhone,
        password: formData.adminPassword,
      }
    };

    try {
      await adminService.createSchoolWithAdmin(payload);
      navigate("/admin/schools");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create school and admin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link to="/admin/schools" className="flex items-center gap-2 text-slate-500 hover:text-[#207D86] mb-4 w-fit transition-colors">
          <FiArrowLeft /> <span>Back to Schools</span>
        </Link>
        <h1 className="text-3xl font-bold text-slate-800">Register New School</h1>
        <p className="text-slate-500 mt-1">Create a new institution and assign its first School Admin.</p>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Two Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* --- LEFT COLUMN: SCHOOL INFO --- */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-xl font-semibold text-slate-800 mb-6 border-b pb-2">Institution Details</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">School Name *</label>
                <input required type="text" name="schoolName" value={formData.schoolName} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#207D86] focus:ring-1 focus:ring-[#207D86] outline-none transition-all" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Contact Email</label>
                  <input type="email" name="schoolEmail" value={formData.schoolEmail} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#207D86] focus:ring-1 focus:ring-[#207D86] outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Contact Phone</label>
                  <input type="text" name="schoolPhone" value={formData.schoolPhone} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#207D86] focus:ring-1 focus:ring-[#207D86] outline-none transition-all" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Street Address</label>
                <input type="text" name="street" value={formData.street} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#207D86] focus:ring-1 focus:ring-[#207D86] outline-none transition-all" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
                  <input type="text" name="city" value={formData.city} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#207D86] focus:ring-1 focus:ring-[#207D86] outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">State / Province</label>
                  <input type="text" name="state" value={formData.state} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#207D86] focus:ring-1 focus:ring-[#207D86] outline-none transition-all" />
                </div>
              </div>
            </div>
          </div>

          {/* --- RIGHT COLUMN: ADMIN INFO --- */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-xl font-semibold text-slate-800 mb-6 border-b pb-2">School Admin Details</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">First Name *</label>
                  <input required type="text" name="adminFirstName" value={formData.adminFirstName} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#207D86] focus:ring-1 focus:ring-[#207D86] outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Last Name *</label>
                  <input required type="text" name="adminLastName" value={formData.adminLastName} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#207D86] focus:ring-1 focus:ring-[#207D86] outline-none transition-all" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Admin Email *</label>
                <input required type="email" name="adminEmail" value={formData.adminEmail} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#207D86] focus:ring-1 focus:ring-[#207D86] outline-none transition-all" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Admin Phone Number *</label>
                <input required type="text" name="adminPhone" value={formData.adminPhone} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#207D86] focus:ring-1 focus:ring-[#207D86] outline-none transition-all" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Temporary Password *</label>
                <input required type="password" name="adminPassword" value={formData.adminPassword} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#207D86] focus:ring-1 focus:ring-[#207D86] outline-none transition-all" />
                <p className="text-xs text-slate-500 mt-1">They can change this after their first login.</p>
              </div>
            </div>
          </div>

        </div>

        {/* --- Submit Button --- */}
        <div className="flex justify-end pt-4">
          <button 
            type="submit" 
            disabled={loading}
            className="flex items-center gap-2 bg-[#207D86] hover:bg-[#186269] text-white px-8 py-3 rounded-xl font-medium transition-colors shadow-lg shadow-[#207D86]/30 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
            ) : (
              <FiCheck className="w-5 h-5" />
            )}
            <span>{loading ? "Creating..." : "Register School & Admin"}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateSchool;