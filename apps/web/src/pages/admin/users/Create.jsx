import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import adminService from "../../../services/AdminService";
import api from "../../../api/Axios"; // Import API for fetching grades/levels directly
import { FiArrowLeft, FiCheck, FiLoader } from "react-icons/fi";

const CreateUser = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // --- Metadata State ---
  const [grades, setGrades] = useState([]);
  const [levels, setLevels] = useState([]);
  const [metaLoading, setMetaLoading] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    password: "",
    role: "student", // default
    grade: "",       // Required if student
    level: ""        // Required if student
  });

  // --- Fetch Grades & Levels on Mount ---
  useEffect(() => {
    const fetchMetadata = async () => {
      setMetaLoading(true);
      try {
        // Assuming you have public or protected routes for these
        const [gradesRes, levelsRes] = await Promise.all([
          api.get("/grades"), // Adjust endpoint if needed (e.g., /public/grades)
          api.get("/levels")
        ]);
        setGrades(gradesRes.data);
        setLevels(levelsRes.data);
      } catch (err) {
        console.error("Failed to load grades/levels", err);
        // We don't block the UI, but dropdowns will be empty
      } finally {
        setMetaLoading(false);
      }
    };
    fetchMetadata();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Frontend Validation for Student Grade
    if (formData.role === "student" && !formData.grade) {
      setError("Grade is required for Student accounts.");
      setLoading(false);
      return;
    }

    try {
      // Clean up data: Remove grade/level if not a student to keep DB clean
      const payload = { ...formData };
      if (payload.role !== "student") {
        delete payload.grade;
        delete payload.level;
      }

      await adminService.createUser(payload);
      navigate("/admin/users");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create user.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link to="/admin/users" className="flex items-center gap-2 text-slate-500 hover:text-[#207D86] mb-4 w-fit transition-colors">
          <FiArrowLeft /> <span>Back to Users</span>
        </Link>
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Add New User</h1>
            <p className="text-slate-500 mt-1">Manually create a user and assign their system role.</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-600"></span>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* --- Personal Info --- */}
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

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Temporary Password *</label>
            <input required type="password" name="password" value={formData.password} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#207D86] focus:ring-1 focus:ring-[#207D86] outline-none transition-all" />
          </div>

          {/* --- Role Selection --- */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">System Role *</label>
            <select 
              name="role" 
              value={formData.role} 
              onChange={handleChange} 
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#207D86] focus:ring-1 focus:ring-[#207D86] outline-none transition-all cursor-pointer bg-white"
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="school_admin">School Admin</option>
              <option value="donor">Donor</option>
              <option value="super_admin">Super Admin</option>
            </select>
            <p className="text-xs text-slate-500 mt-1">Defines what dashboards and permissions they can access.</p>
          </div>

          {/* --- CONDITIONAL: Student Grade & Level --- */}
          {formData.role === "student" && (
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-slate-50 rounded-xl border border-slate-200 animate-in fade-in slide-in-from-top-2">
              <div className="md:col-span-2">
                <h3 className="text-sm font-bold text-[#207D86] uppercase tracking-wider mb-2">Student Academics</h3>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Grade *</label>
                <div className="relative">
                  <select 
                    name="grade" 
                    value={formData.grade} 
                    onChange={handleChange} 
                    required={formData.role === "student"}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#207D86] focus:ring-1 focus:ring-[#207D86] outline-none transition-all bg-white"
                  >
                    <option value="">Select Grade</option>
                    {grades.map(g => (
                      <option key={g._id} value={g._id}>{g.name}</option>
                    ))}
                  </select>
                  {metaLoading && <div className="absolute right-3 top-3"><FiLoader className="animate-spin text-[#207D86]" /></div>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Level (Optional)</label>
                <select 
                  name="level" 
                  value={formData.level} 
                  onChange={handleChange} 
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#207D86] focus:ring-1 focus:ring-[#207D86] outline-none transition-all bg-white"
                >
                  <option value="">Select Level</option>
                  {levels.map(l => (
                    <option key={l._id} value={l._id}>{l.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

        </div>

        <div className="flex justify-end pt-8 mt-4 border-t border-slate-100">
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
            <span>{loading ? "Creating..." : "Create User"}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateUser;