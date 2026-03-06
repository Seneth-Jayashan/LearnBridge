import api from "../api/Axios";

const adminService = {
  // ==========================================
  // --- School Management ---
  // ==========================================
  async createSchoolWithAdmin(payload) {
    const response = await api.post("/admin/create-school", payload);
    return response.data; 
  },
  
  async getAllSchools() {
    const response = await api.get("/admin/schools");
    return response.data; 
  },

  async getSchoolById(id) {
    const response = await api.get(`/admin/schools/${id}`);
    return response.data;
  },

  async updateSchool(id, schoolData) {
    const response = await api.put(`/admin/schools/${id}`, schoolData);
    return response.data;
  },

  async deleteSchool(id) {
    return await api.delete(`/admin/schools/${id}`);
  },

  // ==========================================
  // --- User Management ---
  // ==========================================
  async createUser(userData) {
    const response = await api.post("/admin/create-user", userData);
    return response.data;
  },
  
  async getAllUsers() {
    const response = await api.get("/admin/users");
    return response.data;
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