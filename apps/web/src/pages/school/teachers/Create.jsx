import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../../api/Axios";
import { useSchoolAdmin } from "../../../contexts/SchoolAdminContext";
import { FiArrowLeft, FiCheck } from "react-icons/fi";

const CreateTeacher = () => {
  const navigate = useNavigate();
  const { schoolDetails, fetchAllDashboardData } = useSchoolAdmin();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Use the public teacher registration endpoint, but pass this school's ID
      await api.post("/user/register-teacher", {
        ...formData,
        schoolId: schoolDetails._id 
      });

      // Refresh the context data so the new teacher appears in the "Pending" list
      await fetchAllDashboardData();
      
      // Send them back to the pending tab
      navigate("/school/teachers");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to register teacher.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link to="/school/teachers" className="flex items-center gap-2 text-slate-500 hover:text-[#207D86] mb-4 w-fit transition-colors">
          <FiArrowLeft /> <span>Back to Faculty</span>
        </Link>
        <h1 className="text-3xl font-bold text-slate-800">Add New Teacher</h1>
        <p className="text-slate-500 mt-1">Register a new educator. They will be placed in your pending requests for final approval.</p>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6">{error}</div>}

      <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">First Name *</label>
            <input required type="text" name="firstName" value={formData.firstName} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#207D86] focus:ring-1 focus:ring-[#207D86] outline-none transition-all" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Last Name *</label>
            <input required type="text" name="lastName" value={formData.lastName} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#207D86] focus:ring-1 focus:ring-[#207D86] outline-none transition-all" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email Address *</label>
            <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#207D86] focus:ring-1 focus:ring-[#207D86] outline-none transition-all" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number *</label>
            <input required type="text" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#207D86] focus:ring-1 focus:ring-[#207D86] outline-none transition-all" />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Temporary Password *</label>
            <input required type="password" name="password" value={formData.password} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#207D86] focus:ring-1 focus:ring-[#207D86] outline-none transition-all" />
            <p className="text-xs text-slate-500 mt-1">They can change this password upon their first login.</p>
          </div>

        </div>

        <div className="flex justify-end pt-8 mt-6 border-t border-slate-100">
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
            <span>{loading ? "Registering..." : "Register Teacher"}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateTeacher;