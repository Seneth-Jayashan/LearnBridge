import api from "../api/Axios";

const userService = {
  async getPublicSchools() {
    const response = await api.get("/user/schools");
    return response.data;
  },
  
  // --- Public Registration ---
  async registerDonor(donorData) {
    const response = await api.post("/user/register-donor", donorData);
    return response.data;
  },

  async registerTeacher(teacherData) {
    const response = await api.post("/user/register-teacher", teacherData);
    return response.data;
  },

  // --- Profile Management (Protected) ---
  async updateMyProfile(profileData) {
    const response = await api.put("/user/profile", profileData);
    return response.data;
  },

  async updateMyPassword(passwordData) {
    // passwordData: { currentPassword, newPassword }
    const response = await api.put("/user/update-password", passwordData);
    return response.data;
  },

  async deleteMyAccount() {
    const response = await api.delete("/user/profile");
    return response.data;
  },

  // --- Account Recovery ---
  async restoreAccount(identifier) {
    const response = await api.post("/user/restore", { identifier });
    return response.data;
  }
};

export default userService;