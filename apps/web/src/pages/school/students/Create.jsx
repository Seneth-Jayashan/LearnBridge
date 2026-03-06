import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useSchoolAdmin } from "../../../contexts/SchoolAdminContext";
import api from "../../../api/Axios"; // Direct API access for metadata
import { FiArrowLeft, FiCheck, FiLoader } from "react-icons/fi";

const CreateStudent = () => {
  const navigate = useNavigate();
  const { createStudent } = useSchoolAdmin();
  
  const [loading, setLoading] = useState(false);
  const [metaLoading, setMetaLoading] = useState(false);
  const [error, setError] = useState("");

  // Metadata State
  const [grades, setGrades] = useState([]);
  const [levels, setLevels] = useState([]);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    password: "",
    grade: "", // REQUIRED
    level: ""  // Optional
  });

  // Fetch Grades/Levels on Mount
  useEffect(() => {
    const fetchMetadata = async () => {
      setMetaLoading(true);
      try {
        const [gradesRes, levelsRes] = await Promise.all([
          api.get("/grades"), // Adjust path if needed (e.g. /public/grades)
          api.get("/levels")
        ]);
        setGrades(gradesRes.data);
        setLevels(levelsRes.data);
      } catch (err) {
        console.error("Failed to load metadata", err);
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

    // Frontend Validation
    if (!formData.grade) {
      setError("Please select a Grade for the student.");
      setLoading(false);
      return;
    }

    const result = await createStudent(formData);
    
    if (result.success) {
      navigate("/school/students");
    } else {
      setError(result.message || "Failed to create student.");
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link to="/school/students" className="flex items-center gap-2 text-slate-500 hover:text-[#207D86] mb-4 w-fit transition-colors">
          <FiArrowLeft /> <span>Back to Students</span>
        </Link>
        <h1 className="text-3xl font-bold text-slate-800">Enroll New Student</h1>
        <p className="text-slate-500 mt-1">Create a student account. They will automatically be assigned a Registration Number.</p>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 flex items-center gap-2 font-medium">{error}</div>}

      <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Identity */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">First Name *</label>
            <input required type="text" name="firstName" value={formData.firstName} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#207D86] focus:ring-1 focus:ring-[#207D86] outline-none transition-all" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Last Name *</label>
            <input required type="text" name="lastName" value={formData.lastName} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#207D86] focus:ring-1 focus:ring-[#207D86] outline-none transition-all" />
          </div>

          {/* Contact */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Parent/Student Email (Optional)</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#207D86] focus:ring-1 focus:ring-[#207D86] outline-none transition-all" />
            <p className="text-xs text-slate-500 mt-1">Students can share parent emails.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Parent/Student Phone Number *</label>
            <input required type="text" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#207D86] focus:ring-1 focus:ring-[#207D86] outline-none transition-all" />
          </div>

          {/* Academics Section (New) */}
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="md:col-span-2">
              <h3 className="text-sm font-bold text-[#207D86] uppercase tracking-wider mb-2">Academic Placement</h3>
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-slate-700 mb-1">Grade *</label>
              <select 
                required 
                name="grade" 
                value={formData.grade} 
                onChange={handleChange} 
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#207D86] focus:ring-1 focus:ring-[#207D86] outline-none transition-all bg-white appearance-none cursor-pointer"
              >
                <option value="">Select Grade</option>
                {grades.map(g => (
                  <option key={g._id} value={g._id}>{g.name}</option>
                ))}
              </select>
              {metaLoading && <div className="absolute right-3 top-9"><FiLoader className="animate-spin text-[#207D86]" /></div>}
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-slate-700 mb-1">Level (Optional)</label>
              <select 
                name="level" 
                value={formData.level} 
                onChange={handleChange} 
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#207D86] focus:ring-1 focus:ring-[#207D86] outline-none transition-all bg-white appearance-none cursor-pointer"
              >
                <option value="">Select Level</option>
                {levels.map(l => (
                  <option key={l._id} value={l._id}>{l.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Security */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Temporary Password *</label>
            <input required type="password" name="password" value={formData.password} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#207D86] focus:ring-1 focus:ring-[#207D86] outline-none transition-all" />
            <p className="text-xs text-slate-500 mt-1">They will use their Registration Number (STUXXXXXX) and this password to log in.</p>
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
            <span>{loading ? "Enrolling..." : "Enroll Student"}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateStudent;