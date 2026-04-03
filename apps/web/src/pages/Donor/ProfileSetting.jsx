// src/pages/donor/ProfileSettings.jsx
import { useEffect, useState } from "react";
import {
  getDonorProfile,
  updateDonorProfile,
  changePassword,
} from "../../services/DonorServices";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function ProfileSettings() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    address: {
      street: "",
      city: "",
    },
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await getDonorProfile();
      const u = res.data;
      setProfile(u);
      setForm({
        firstName: u.firstName || "",
        lastName: u.lastName || "",
        email: u.email || "",
        phoneNumber: u.phoneNumber || "",
        address: {
          street: u.address?.street || "",
          city: u.address?.city || "",
        },
      });
    } catch (err) {
      toast.error("Failed to load profile.");
    } finally {
      setLoading(false);
    }
  };

  // ── Update Profile ─────────────────────────────────────────────
  const handleProfileSave = async () => {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      toast.error("First and last name are required.");
      return;
    }
    try {
      setSaving(true);
      await updateDonorProfile(form);
      toast.success("Profile updated successfully ✅");
      fetchProfile();
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed.");
    } finally {
      setSaving(false);
    }
  };

  // ── Change Password ────────────────────────────────────────────
  const handlePasswordChange = async () => {
    if (
      !passwordForm.currentPassword ||
      !passwordForm.newPassword ||
      !passwordForm.confirmPassword
    ) {
      toast.error("All password fields are required.");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    try {
      setSaving(true);
      await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success("Password changed successfully 🔒");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      toast.error(err.response?.data?.message || "Password change failed.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#4CAF50]" />
      </div>
    );
  }

  const initials = `${profile?.firstName?.charAt(0) || ""}${profile?.lastName?.charAt(0) || ""}`.toUpperCase();

  return (
    <div className="p-8 min-h-screen">

      <ToastContainer position="top-right" autoClose={3000} />

      {/* Header */}
      <h1 className="text-2xl font-bold text-[#0A1D32] mb-1">Profile Settings</h1>
      <p className="text-slate-500 text-sm mb-8">
        Manage your account details and security.
      </p>

      <div className="max-w-3xl mx-auto flex flex-col gap-6">

        {/* Profile Card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center gap-5">

            {/* Avatar */}
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-linear-to-r from-[#207D86] to-[#4CAF50] flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                {profile?.profileImage ? (
                  <img
                    src={profile.profileImage}
                    alt="Profile"
                    className="w-20 h-20 rounded-full object-cover"
                  />
                ) : (
                  initials
                )}
              </div>
              <span className="absolute bottom-0 right-0 w-5 h-5 bg-[#4CAF50] rounded-full border-2 border-white" />
            </div>

            {/* Name + Role */}
            <div>
              <h2 className="text-lg font-bold text-[#0A1D32]">
                {profile?.firstName} {profile?.lastName}
              </h2>
              <p className="text-sm text-slate-400">{profile?.email}</p>
              {profile?.phoneNumber && (
                <p className="text-xs text-slate-400 mt-0.5">
                  📞 {profile.phoneNumber}
                </p>
              )}
              <span className="mt-1.5 inline-block text-xs px-3 py-0.5 rounded-full bg-[#207D86]/10 text-[#207D86] font-semibold capitalize">
                {profile?.role}
              </span>
            </div>

            {/* Joined */}
            <div className="ml-auto text-right hidden sm:block">
              <p className="text-xs text-slate-400">Member since</p>
              <p className="text-sm font-semibold text-[#0A1D32]">
                {profile?.createdAt
                  ? new Date(profile.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "—"}
              </p>
            </div>

          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 bg-white p-1.5 rounded-xl border border-slate-100 shadow-sm w-fit">
          {["profile", "password"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === tab
                  ? "bg-linear-to-r from-[#207D86] to-[#4CAF50] text-white shadow-md"
                  : "text-slate-500 hover:text-[#207D86]"
              }`}
            >
              {tab === "profile" ? "👤 Edit Profile" : "🔒 Change Password"}
            </button>
          ))}
        </div>

        {/* ── Edit Profile Form ── */}
        {activeTab === "profile" && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col gap-5">
            <h3 className="text-base font-bold text-[#0A1D32]">Edit Profile</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField
                label="First Name"
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                placeholder="First name"
              />
              <InputField
                label="Last Name"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                placeholder="Last name"
              />
            </div>

            <InputField
              label="Email Address"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="your@email.com"
            />

            <InputField
              label="Phone Number"
              type="tel"
              value={form.phoneNumber}
              onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
              placeholder="+94 77 000 0000"
            />

            {/* Address */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                Address
              </p>
              <div className="flex flex-col gap-3">
                <InputField
                  label="Street"
                  value={form.address.street}
                  onChange={(e) =>
                    setForm({ ...form, address: { ...form.address, street: e.target.value } })
                  }
                  placeholder="Street address"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputField
                    label="City"
                    value={form.address.city}
                    onChange={(e) =>
                      setForm({ ...form, address: { ...form.address, city: e.target.value } })
                    }
                    placeholder="City"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleProfileSave}
                disabled={saving}
                className="px-8 py-2.5 text-sm font-semibold rounded-xl bg-linear-to-r from-[#207D86] to-[#4CAF50] text-white hover:shadow-lg hover:scale-[1.02] transition-all duration-200 disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        )}

        {/* ── Change Password Form ── */}
        {activeTab === "password" && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col gap-5">
            <h3 className="text-base font-bold text-[#0A1D32]">Change Password</h3>

            <PasswordField
              label="Current Password"
              value={passwordForm.currentPassword}
              show={showCurrent}
              onToggle={() => setShowCurrent(!showCurrent)}
              onChange={(e) =>
                setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
              }
              placeholder="Enter current password"
            />

            <PasswordField
              label="New Password"
              value={passwordForm.newPassword}
              show={showNew}
              onToggle={() => setShowNew(!showNew)}
              onChange={(e) =>
                setPasswordForm({ ...passwordForm, newPassword: e.target.value })
              }
              placeholder="Min. 6 characters"
            />

            <PasswordField
              label="Confirm New Password"
              value={passwordForm.confirmPassword}
              show={showConfirm}
              onToggle={() => setShowConfirm(!showConfirm)}
              onChange={(e) =>
                setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
              }
              placeholder="Repeat new password"
            />

            {/* Match Indicator */}
            {passwordForm.newPassword && passwordForm.confirmPassword && (
              <p className={`text-xs font-medium ${
                passwordForm.newPassword === passwordForm.confirmPassword
                  ? "text-green-500"
                  : "text-red-400"
              }`}>
                {passwordForm.newPassword === passwordForm.confirmPassword
                  ? "✅ Passwords match"
                  : "❌ Passwords do not match"}
              </p>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={handlePasswordChange}
                disabled={saving}
                className="px-8 py-2.5 text-sm font-semibold rounded-xl bg-linear-to-r from-[#207D86] to-[#4CAF50] text-white hover:shadow-lg hover:scale-[1.02] transition-all duration-200 disabled:opacity-60"
              >
                {saving ? "Updating..." : "Update Password 🔒"}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// ─── Reusable Input Field ─────────────────────────────────────────────────────
function InputField({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="rounded-xl px-4 py-3 text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#207D86] transition text-[#0A1D32] placeholder:text-slate-300"
      />
    </div>
  );
}

// ─── Password Field ───────────────────────────────────────────────────────────
function PasswordField({ label, value, show, onToggle, onChange, placeholder }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
        {label}
      </label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full rounded-xl px-4 py-3 pr-12 text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#207D86] transition text-[#0A1D32] placeholder:text-slate-300"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#207D86] transition text-sm"
        >
          {show ? "🙈" : "👁️"}
        </button>
      </div>
    </div>
  );
}