import api from "../api/Axios";

const adminService = {
  // --- School Management ---
  async createSchoolWithAdmin(payload) {
    // payload: { schoolData: {...}, adminData: {...} }
    const response = await api.post("/admin/create-school", payload);
    return response.data; 
  },

  // --- User Management ---
  async createUser(userData) {
    const response = await api.post("/admin/create-user", userData);
    return response.data;
  },

  async getAllUsers() {
    const response = await api.get("/admin/users");
    return response.data; // Returns Array of users
  },

  async getUserById(id) {
    const response = await api.get(`/admin/users/${id}`);
    return response.data;
  },

  async updateUser(id, userData) {
    const response = await api.put(`/admin/users/${id}`, userData);
    return response.data;
  },

  async deleteUser(id) {
    return await api.delete(`/admin/users/${id}`);
  },

  // --- Status & Security ---
  async toggleUserStatus(id) {
    return await api.patch(`/admin/users/${id}/toggle-status`);
  },

  async toggleUserLock(id) {
    return await api.patch(`/admin/users/${id}/toggle-lock`);
  },

  async restoreUser(id) {
    return await api.patch(`/admin/users/${id}/restore`);
  },
};

export default adminService;