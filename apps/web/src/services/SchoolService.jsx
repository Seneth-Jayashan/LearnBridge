import api from "../api/Axios";

const schoolService = {
  // ==========================================
  // --- Dashboard & Profile ---
  // ==========================================
  async getMySchoolDetails() {
    const response = await api.get("/school-admin/my-school");
    return response.data; // Returns School object populated with refs
  },

  async updateSchoolProfile(profileData) {
    const response = await api.put("/school-admin/my-school", profileData);
    return response.data;
  },

  // ==========================================
  // --- Student Management ---
  // ==========================================
  async getSchoolStudents() {
    const response = await api.get("/school-admin/students");
    return response.data;
  },

  async createStudent(studentData) {
    const response = await api.post("/school-admin/students", studentData);
    return response.data;
  },

  async updateStudent(studentId, studentData) {
    const response = await api.put(`/school-admin/students/${studentId}`, studentData);
    return response.data;
  },

  async toggleStudentStatus(studentId) {
    const response = await api.patch(`/school-admin/students/${studentId}/deactivate`);
    return response.data;
  },

  // ==========================================
  // --- Teacher Management ---
  // ==========================================

  async createTeacher(teacherData) {
    const response = await api.post("/school-admin/teachers", teacherData);
    return response.data;
  },

  async getVerifiedTeachers() {
    const response = await api.get("/school-admin/teachers");
    return response.data; 
  },

  async getPendingTeachers() {
    const response = await api.get("/school-admin/teachers/pending");
    return response.data; 
  },

  async verifyTeacher(teacherId) {
    const response = await api.patch(`/school-admin/teachers/${teacherId}/verify`);
    return response.data;
  },

  async removeTeacherFromSchool(teacherId) {
    const response = await api.delete(`/school-admin/teachers/${teacherId}/remove`);
    return response.data;
  }
};

export default schoolService;