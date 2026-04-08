import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import adminService from "../../../services/AdminService"; 
import { 
  FiArrowLeft, FiBriefcase, FiMail, FiPhone, FiMapPin,
  FiSave, FiCheckCircle, FiAlertCircle, FiActivity, FiCamera
} from "react-icons/fi";

const UpdateSchool = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // --- State ---
  const [formData, setFormData] = useState({
    name: "",
    contactEmail: "",
    contactPhone: "",
    isActive: true,
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
    }
  });

  // Image upload states
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // --- Load School Data ---
  useEffect(() => {
    const fetchSchool = async () => {
      try {
        const school = await adminService.getSchoolById(id);
        setFormData({
          name: school.name || "",
          contactEmail: school.contactEmail || "",
          contactPhone: school.contactPhone || "",
          isActive: school.isActive ?? true,
          address: {
            street: school.address?.street || "",
            city: school.address?.city || "",
            state: school.address?.state || "",
            zipCode: school.address?.zipCode || "",
          }
        });
        
        // Set existing logo preview if it exists
        if (school.logoUrl) {
          setLogoPreview(school.logoUrl);
        }
      } catch (err) {
        setMessage({ 
          type: "error", 
          text: err.response?.data?.message || "Failed to load school data." 
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchSchool();
  }, [id]);

  // --- Handlers ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith("address.")) {
      const addressField = name.split(".")[1];
      setFormData(prev => ({
        ...prev,
        address: { ...prev.address, [addressField]: value }
      }));
    } else if (name === "isActive") {
      setFormData(prev => ({ ...prev, isActive: value === "true" }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage({ type: "", text: "" });

    try {
      let dataToSend;

      // If a new file is selected, we MUST use FormData
      if (logoFile) {
        dataToSend = new FormData();
        dataToSend.append("name", formData.name);
        dataToSend.append("contactEmail", formData.contactEmail);
        dataToSend.append("contactPhone", formData.contactPhone);
        dataToSend.append("isActive", formData.isActive);
        dataToSend.append("address[street]", formData.address.street);
        dataToSend.append("address[city]", formData.address.city);
        dataToSend.append("address[state]", formData.address.state);
        dataToSend.append("address[zipCode]", formData.address.zipCode);
        dataToSend.append("logo", logoFile); // Append the actual file
      } else {
        // Otherwise, standard JSON is fine
        dataToSend = formData;
      }

      await adminService.updateSchool(id, dataToSend);
      setMessage({ type: "success", text: "School updated successfully!" });
      
      setTimeout(() => {
        navigate("/admin/schools");
      }, 1500);

    } catch (err) {
      setMessage({ 
        type: "error", 
        text: err.response?.data?.message || "Failed to update school." 
      });
      setIsSaving(false);
    }
  };

  // Helper for the avatar initials fallback
  const getInitials = () => {
    if (!formData.name) return "S";
    return formData.name.substring(0, 2).toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-[#207D86]"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="mb-8">
        <Link 
          to="/admin/schools" 
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-[#207D86] transition-colors mb-4"
        >
          <FiArrowLeft /> Back to Schools
        </Link>
        <h1 className="text-3xl font-bold text-slate-800">Edit School</h1>
        <p className="text-slate-500 mt-1">Update institutional details, logo, and status.</p>
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
        
        {/* Logo Upload Zone */}
        <div className="px-6 md:px-8 py-8 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row items-center gap-6">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageChange} 
            accept="image/*" 
            className="hidden" 
          />

          <div 
            onClick={triggerFileInput}
            className="relative w-28 h-28 rounded-2xl shadow-lg border-2 border-white bg-linear-to-tr from-[#0E2A47] to-[#207D86] flex items-center justify-center shrink-0 cursor-pointer group overflow-hidden"
          >
            {logoPreview ? (
              <img src={logoPreview} alt="School Logo" className="w-full h-full object-cover bg-white" />
            ) : (
              <span className="text-white text-3xl font-bold">{getInitials()}</span>
            )}
            
            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-1 backdrop-blur-[2px]">
              <FiCamera className="w-6 h-6" />
              <span className="text-xs font-semibold uppercase tracking-wider">Change</span>
            </div>
          </div>

          <div className="text-center md:text-left">
            <h2 className="text-2xl font-bold text-slate-800">
              {formData.name || "School Name"}
            </h2>
            <p className="text-slate-500 font-medium mt-1">Click the image to upload a new logo</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8">
          
          {/* --- Institutional Details --- */}
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-5">
              <div className="p-2 bg-[#207D86]/10 rounded-lg text-[#207D86]">
                <FiBriefcase className="w-5 h-5" />
              </div>
              Institutional Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-2">School Name</label>
                <input 
                  type="text" name="name" value={formData.name} onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-50/50 focus:bg-white rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#207D86]/20 focus:border-[#207D86] transition-all outline-none text-slate-700"
                  placeholder="Greenwood High School" required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Contact Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FiMail className="text-slate-400 w-5 h-5" />
                  </div>
                  <input 
                    type="email" name="contactEmail" value={formData.contactEmail} onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50/50 focus:bg-white rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#207D86]/20 focus:border-[#207D86] transition-all outline-none text-slate-700"
                    placeholder="admin@school.edu" required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Contact Phone</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FiPhone className="text-slate-400 w-5 h-5" />
                  </div>
                  <input 
                    type="tel" name="contactPhone" value={formData.contactPhone} onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50/50 focus:bg-white rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#207D86]/20 focus:border-[#207D86] transition-all outline-none text-slate-700"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* --- Campus Address --- */}
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-5">
              <div className="p-2 bg-[#207D86]/10 rounded-lg text-[#207D86]">
                <FiMapPin className="w-5 h-5" />
              </div>
              Campus Address
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Street Address</label>
                <input 
                  type="text" name="address.street" value={formData.address.street} onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-50/50 focus:bg-white rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#207D86]/20 focus:border-[#207D86] transition-all outline-none text-slate-700"
                  placeholder="123 Education Blvd"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">City</label>
                <input 
                  type="text" name="address.city" value={formData.address.city} onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-50/50 focus:bg-white rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#207D86]/20 focus:border-[#207D86] transition-all outline-none text-slate-700"
                  placeholder="Springfield"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">State / Province</label>
                  <input 
                    type="text" name="address.state" value={formData.address.state} onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-50/50 focus:bg-white rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#207D86]/20 focus:border-[#207D86] transition-all outline-none text-slate-700"
                    placeholder="IL"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Zip / Postal Code</label>
                  <input 
                    type="text" name="address.zipCode" value={formData.address.zipCode} onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-50/50 focus:bg-white rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#207D86]/20 focus:border-[#207D86] transition-all outline-none text-slate-700"
                    placeholder="12345"
                  />
                </div>
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* --- Status Management --- */}
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-5">
              <div className="p-2 bg-[#207D86]/10 rounded-lg text-[#207D86]">
                <FiActivity className="w-5 h-5" />
              </div>
              Status Management
            </h3>
            
            <div className="md:w-1/2">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Account Status</label>
              <select 
                name="isActive" 
                value={formData.isActive.toString()} 
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-50/50 focus:bg-white rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#207D86]/20 focus:border-[#207D86] transition-all outline-none text-slate-700 cursor-pointer"
              >
                <option value="true">Active (Visible & Functional)</option>
                <option value="false">Inactive (Suspended)</option>
              </select>
              <p className="text-xs text-slate-500 mt-2">
                Setting a school to inactive will prevent its admins, teachers, and students from accessing the platform.
              </p>
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
              <span>{isSaving ? "Saving..." : "Save School Changes"}</span>
            </button>
          </div>
          
        </form>
      </div>
    </div>
  );
};

export default UpdateSchool;