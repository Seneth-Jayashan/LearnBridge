import api from "../api/Axios";

const authService = {
  // --- Core Auth ---
  async getCurrentUser() {
    const response = await api.get("/auth/me");
    return response.data; // Expecting { user: ... }
  },

  async login(identifier, password) {
    const response = await api.post("/auth/login", { identifier, password });
    return response.data; // Expecting { user: ..., accessToken: ... }
  },

  async logout() {
    return await api.post("/auth/logout");
  },

  // --- Registration & Account Management ---
  async registerDonor(userData) {
    return await api.post("/user/register-donor", userData);
  },

  async restoreAccount(identifier) {
    return await api.post("/user/restore", { identifier });
  },

  // --- Password Recovery ---
  async forgotPassword(identifier) {
    return await api.post("/auth/forgot-password", { identifier });
  },

  async resetPassword(identifier, otp, newPassword) {
    return await api.post("/auth/reset-password", { identifier, otp, newPassword });
  },
};

export default authService;