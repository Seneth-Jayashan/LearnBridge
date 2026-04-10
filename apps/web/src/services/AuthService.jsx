import api from "../api/Axios";

const ACCESS_TOKEN_KEY = "accessToken";

const getAuthHeaders = () => {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const syncAuthHeader = () => {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};

syncAuthHeader();

const authService = {
  // --- Core Auth ---
  async getCurrentUser() {
    syncAuthHeader();
    const response = await api.get("/auth/me", { headers: getAuthHeaders() });
    return response.data; 
  },

  async login(identifier, password) {
    const response = await api.post("/auth/login", { identifier, password });
    
    // Only set token if it's a normal login (not an OTP interception)
    const accessToken = response.data?.accessToken;
    if (accessToken) {
      localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
      syncAuthHeader();
    }
    return response.data; 
  },

  async refresh() {
    const response = await api.post("/auth/refresh");
    return response.data;
  },

  async logout() {
    const response = await api.post("/auth/logout", {}, { headers: getAuthHeaders() });
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    syncAuthHeader();
    return response;
  },

  // ==========================================
  // --- NEW: FIRST LOGIN FLOW ---
  // ==========================================
  async verifyFirstLoginOtp(userId, otp) {
    const response = await api.post("/auth/verify-first-login-otp", { userId, otp });
    return response.data; 
  },

  async setupNewPassword(resetToken, newPassword) {
    const response = await api.post("/auth/setup-new-password", { resetToken, newPassword });
    
    // This acts as a login, so save the token
    const accessToken = response.data?.accessToken;
    if (accessToken) {
      localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
      syncAuthHeader();
    }
    return response.data; // Expecting { message, accessToken, user }
  },

  // --- Registration & Account Management ---
  async registerDonor(userData) {
    return await api.post("/users/register-donor", userData);
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