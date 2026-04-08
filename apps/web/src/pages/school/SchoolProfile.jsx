import React, { useState, useEffect, useRef } from "react";
import { useSchoolAdmin } from "../../contexts/SchoolAdminContext"; 
import { 
  FiBriefcase, FiMail, FiPhone, FiMapPin, 
  FiSave, FiCheckCircle, FiAlertCircle, FiLock, FiCamera
} from "react-icons/fi";

const SchoolProfile = () => {
  const { schoolDetails, updateProfile } = useSchoolAdmin();
  const fileInputRef = useRef(null);

  // Initialize form state
  const [formData, setFormData] = useState({
    contactEmail: "",
    contactPhone: "",
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
    }
  });

  // State for image uploading & preview
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Populate form when school details load from context
  useEffect(() => {
    if (schoolDetails) {
      setFormData({
        contactEmail: schoolDetails.contactEmail || "",
        contactPhone: schoolDetails.contactPhone || "",
        address: {
          street: schoolDetails.address?.street || "",
          city: schoolDetails.address?.city || "",
          state: schoolDetails.address?.state || "",
          zipCode: schoolDetails.address?.zipCode || "",
        }
      });
      // Set the initial image preview if a logoUrl exists in the database
      if (schoolDetails.logoUrl) {
        setLogoPreview(schoolDetails.logoUrl);
      }
    }
  }, [schoolDetails]);

  // Handle standard text inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith("address.")) {
      const addressField = name.split(".")[1];
      setFormData(prev => ({
        ...prev,
        address: { ...prev.address, [addressField]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Handle Image Selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file); // Store the actual file to send to the backend
      setLogoPreview(URL.createObjectURL(file)); // Generate a temporary local URL for immediate preview
    }
  };

  // Trigger the hidden file input
  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage({ type: "", text: "" });

    try {
      /* CRITICAL NOTE FOR BACKEND: 
        Because we are now sending a File, you cannot just send JSON.
        You must build a FormData object if logoFile exists.
      */
      let dataToSend;
      
      if (logoFile) {
        dataToSend = new FormData();
        dataToSend.append("contactEmail", formData.contactEmail);
        dataToSend.append("contactPhone", formData.contactPhone);
        dataToSend.append("address[street]", formData.address.street);
        dataToSend.append("address[city]", formData.address.city);
        dataToSend.append("address[state]", formData.address.state);
        dataToSend.append("address[zipCode]", formData.address.zipCode);
        dataToSend.append("logo", logoFile); // The actual image file
      } else {
        // If no new image, just send standard JSON
        dataToSend = formData;
      }

      // Pass dataToSend to your context method
      const response = await updateProfile(dataToSend);
      
      if (response.success) {
        setMessage({ type: "success", text: "School profile updated successfully!" });
        setLogoFile(null);
      } else {
        setMessage({ type: "error", text: response.message || "Failed to update profile." });
      }
    } catch (error) {
      setMessage({ type: "error", text: "An unexpected error occurred." });
    } finally {
      setIsSaving(false);
    }
  };

  // Helper for the avatar initials fallback
  const getInitials = () => {
    if (!schoolDetails?.name) return "S";
    return schoolDetails.name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">School Profile</h1>
          <p className="text-slate-500 mt-1">Manage your institution's public details and contact information.</p>
        </div>
      </div>

      {/* Success/Error Message */}
      {message.text && (
        <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-sm font-medium border ${
          message.type === "success" ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"
        }`}>
          {message.type === "success" ? <FiCheckCircle className="w-5 h-5 shrink-0" /> : <FiAlertCircle className="w-5 h-5 shrink-0" />}
          {message.text}
        </div>
      )}

      {/* Main Form Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        
        {/* Visual Banner & Logo Upload Zone */}
        <div className="px-6 md:px-8 py-8 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row items-center gap-6">
          
          {/* Hidden File Input */}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageChange} 
            accept="image/*" 
            className="hidden" 
          />

          {/* Interactive Logo Area */}
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
              {schoolDetails?.name || "School Name"}
            </h2>
            <p className="text-slate-500 font-medium mt-1">
              {schoolDetails?.isVerified ? "Verified Institution" : "Pending Verification"}
            </p>
            {schoolDetails?.isVerified && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-green-100 text-green-700 mt-3">
                <FiCheckCircle /> Active Status
              </span>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8">
          
          {/* --- Institutional Information Section --- */}
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-5">
              <div className="p-2 bg-[#207D86]/10 rounded-lg text-[#207D86]">
                <FiBriefcase className="w-5 h-5" />
              </div>
              Institutional Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Institution Name</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={schoolDetails?.name || ""} 
                    readOnly
                    className="w-full px-4 py-3 bg-slate-100 text-slate-500 rounded-xl border border-slate-200 cursor-not-allowed outline-none"
                  />
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <FiLock className="text-slate-400 w-4 h-4" />
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-1.5">School name cannot be changed directly. Contact support for assistance.</p>
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
                    placeholder="contact@school.edu" required
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

          {/* --- Address Section --- */}
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
                  <label className="block text-sm font-semibold text-slate-700 mb-2">State/Province</label>
                  <input 
                    type="text" name="address.state" value={formData.address.state} onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-50/50 focus:bg-white rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#207D86]/20 focus:border-[#207D86] transition-all outline-none text-slate-700"
                    placeholder="IL"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Zip/Postal Code</label>
                  <input 
                    type="text" name="address.zipCode" value={formData.address.zipCode} onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-50/50 focus:bg-white rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#207D86]/20 focus:border-[#207D86] transition-all outline-none text-slate-700"
                    placeholder="12345"
                  />
                </div>
              </div>
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
              <span>{isSaving ? "Saving..." : "Save School Profile"}</span>
            </button>
          </div>
          
        </form>
      </div>
    </div>
  );
};

export default SchoolProfile;