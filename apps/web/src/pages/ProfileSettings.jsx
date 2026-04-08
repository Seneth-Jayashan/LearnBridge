import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext"; 
import { useUser } from "../contexts/UserContext"; // Implemented UserContext
import { 
  FiUser, FiMail, FiPhone, FiMapPin, 
  FiSave, FiCheckCircle, FiAlertCircle, FiLock 
} from "react-icons/fi";

const ProfileSettings = () => {
  const { user } = useAuth(); 
  const { updateProfile, updatePassword } = useUser(); // Using your context actions

  // --- Profile State ---
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    address: {
      street: "",
      city: "",
      state: "",
      zip: "",
    }
  });
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ type: "", text: "" });

  // --- Password State ---
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({ type: "", text: "" });

  // Populate form on load
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phoneNumber: user.phoneNumber || "",
        address: {
          street: user.address?.street || "",
          city: user.address?.city || "",
          state: user.address?.state || "",
          zip: user.address?.zip || "",
        }
      });
    }
  }, [user]);

  // --- Handlers ---
  const handleProfileChange = (e) => {
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

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setIsProfileLoading(true);
    setProfileMessage({ type: "", text: "" });

    // Using the updateProfile function from UserContext
    const response = await updateProfile(formData);
    
    if (response.success) {
      setProfileMessage({ type: "success", text: response.message || "Profile updated successfully!" });
    } else {
      setProfileMessage({ type: "error", text: response.message || "Failed to update profile." });
    }
    
    setIsProfileLoading(false);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage({ type: "error", text: "New passwords do not match." });
      return;
    }

    setIsPasswordLoading(true);
    setPasswordMessage({ type: "", text: "" });

    // Using the updatePassword function from UserContext
    const response = await updatePassword({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword
    });

    if (response.success) {
      setPasswordMessage({ type: "success", text: "Password updated successfully!" });
      // Clear the form on success
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } else {
      setPasswordMessage({ type: "error", text: response.message || "Failed to update password." });
    }

    setIsPasswordLoading(false);
  };

  // Helper to get initials for the avatar
  const getInitials = () => {
    const first = formData.firstName.charAt(0) || "";
    const last = formData.lastName.charAt(0) || "";
    return (first + last).toUpperCase() || "U";
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Profile Settings</h1>
          <p className="text-slate-500 mt-1">Manage your personal information and account security.</p>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        
        {/* Visual Profile Banner/Header */}
        <div className="px-6 md:px-8 py-8 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-linear-to-tr from-[#0E2A47] to-[#207D86] flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-[#207D86]/20 shrink-0">
            {getInitials()}
          </div>
          <div className="text-center md:text-left">
            <h2 className="text-2xl font-bold text-slate-800">
              {formData.firstName || "Your"} {formData.lastName || "Profile"}
            </h2>
            <p className="text-slate-500 font-medium mt-1">{formData.email}</p>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-green-100 text-green-700 mt-3">
              <FiCheckCircle /> Active Account
            </span>
          </div>
        </div>

        {/* =========================================
            FORM 1: PROFILE INFORMATION
        ========================================= */}
        <form onSubmit={handleProfileSubmit} className="p-6 md:p-8 space-y-8">
          
          {/* Profile Success/Error Message */}
          {profileMessage.text && (
            <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium border ${
              profileMessage.type === "success" 
                ? "bg-green-50 text-green-700 border-green-200" 
                : "bg-red-50 text-red-700 border-red-200"
            }`}>
              {profileMessage.type === "success" ? <FiCheckCircle className="w-5 h-5 shrink-0" /> : <FiAlertCircle className="w-5 h-5 shrink-0" />}
              {profileMessage.text}
            </div>
          )}

          {/* --- Personal Information Section --- */}
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-5">
              <div className="p-2 bg-[#207D86]/10 rounded-lg text-[#207D86]">
                <FiUser className="w-5 h-5" />
              </div>
              Personal Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">First Name</label>
                <input 
                  type="text" name="firstName" value={formData.firstName} onChange={handleProfileChange}
                  className="w-full px-4 py-3 bg-slate-50/50 focus:bg-white rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#207D86]/20 focus:border-[#207D86] transition-all outline-none text-slate-700"
                  placeholder="John" required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Last Name</label>
                <input 
                  type="text" name="lastName" value={formData.lastName} onChange={handleProfileChange}
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
                    type="email" name="email" value={formData.email} onChange={handleProfileChange}
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
                    type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleProfileChange}
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
              Address Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Street Address</label>
                <input 
                  type="text" name="address.street" value={formData.address.street} onChange={handleProfileChange}
                  className="w-full px-4 py-3 bg-slate-50/50 focus:bg-white rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#207D86]/20 focus:border-[#207D86] transition-all outline-none text-slate-700"
                  placeholder="123 Main St, Apt 4B"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">City</label>
                <input 
                  type="text" name="address.city" value={formData.address.city} onChange={handleProfileChange}
                  className="w-full px-4 py-3 bg-slate-50/50 focus:bg-white rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#207D86]/20 focus:border-[#207D86] transition-all outline-none text-slate-700"
                  placeholder="New York"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">State</label>
                  <input 
                    type="text" name="address.state" value={formData.address.state} onChange={handleProfileChange}
                    className="w-full px-4 py-3 bg-slate-50/50 focus:bg-white rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#207D86]/20 focus:border-[#207D86] transition-all outline-none text-slate-700"
                    placeholder="NY"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Zip Code</label>
                  <input 
                    type="text" name="address.zip" value={formData.address.zip} onChange={handleProfileChange}
                    className="w-full px-4 py-3 bg-slate-50/50 focus:bg-white rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#207D86]/20 focus:border-[#207D86] transition-all outline-none text-slate-700"
                    placeholder="10001"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button 
              type="submit" 
              disabled={isProfileLoading}
              className="flex items-center gap-2 bg-[#207D86] hover:bg-[#186269] text-white px-8 py-3 rounded-xl font-medium transition-colors shadow-lg shadow-[#207D86]/30 shrink-0 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isProfileLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <FiSave className="w-5 h-5" />
              )}
              <span>{isProfileLoading ? "Saving..." : "Save Profile"}</span>
            </button>
          </div>
        </form>

        <hr className="border-slate-100" />

        {/* =========================================
            FORM 2: SECURITY / PASSWORD
        ========================================= */}
        <form onSubmit={handlePasswordSubmit} className="p-6 md:p-8 space-y-8 bg-slate-50/30">
          
          {/* Password Success/Error Message */}
          {passwordMessage.text && (
            <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium border ${
              passwordMessage.type === "success" 
                ? "bg-green-50 text-green-700 border-green-200" 
                : "bg-red-50 text-red-700 border-red-200"
            }`}>
              {passwordMessage.type === "success" ? <FiCheckCircle className="w-5 h-5 shrink-0" /> : <FiAlertCircle className="w-5 h-5 shrink-0" />}
              {passwordMessage.text}
            </div>
          )}

          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-5">
              <div className="p-2 bg-slate-200/50 rounded-lg text-slate-600">
                <FiLock className="w-5 h-5" />
              </div>
              Security Settings
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2 max-w-md">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Current Password</label>
                <input 
                  type="password" name="currentPassword" value={passwordData.currentPassword} onChange={handlePasswordChange}
                  className="w-full px-4 py-3 bg-white focus:bg-white rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#207D86]/20 focus:border-[#207D86] transition-all outline-none text-slate-700"
                  placeholder="Enter current password" required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">New Password</label>
                <input 
                  type="password" name="newPassword" value={passwordData.newPassword} onChange={handlePasswordChange}
                  className="w-full px-4 py-3 bg-white focus:bg-white rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#207D86]/20 focus:border-[#207D86] transition-all outline-none text-slate-700"
                  placeholder="Enter new password" required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Confirm New Password</label>
                <input 
                  type="password" name="confirmPassword" value={passwordData.confirmPassword} onChange={handlePasswordChange}
                  className="w-full px-4 py-3 bg-white focus:bg-white rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#207D86]/20 focus:border-[#207D86] transition-all outline-none text-slate-700"
                  placeholder="Confirm new password" required
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button 
              type="submit" 
              disabled={isPasswordLoading || !passwordData.currentPassword || !passwordData.newPassword}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-8 py-3 rounded-xl font-medium transition-colors shadow-lg shadow-slate-800/20 shrink-0 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isPasswordLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <FiLock className="w-5 h-5" />
              )}
              <span>{isPasswordLoading ? "Updating..." : "Update Password"}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default ProfileSettings;