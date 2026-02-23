import api from "../api/Axios";

const schoolService = {
  // ==========================================
  // --- Dashboard & Profile ---
  // ==========================================
  async getMySchoolDetails() {
    const response = await api.get("/school/my-school");
    return response.data; // Returns School object populated with refs
  },

  async updateSchoolProfile(profileData) {
    const response = await api.put("/school/my-school", profileData);
    return response.data;
  },

  // ==========================================
  // --- Student Management ---
  // ==========================================
  async getSchoolStudents() {
    const response = await api.get("/school/students");
    return response.data;
  },

  async createStudent(studentData) {
    const response = await api.post("/school/students", studentData);
    return response.data;
  },

  async updateStudent(studentId, studentData) {
    const response = await api.put(`/school/students/${studentId}`, studentData);
    return response.data;
  },

  async toggleStudentStatus(studentId) {
    const response = await api.patch(`/school/students/${studentId}/deactivate`);
    return response.data;
  },

  // ==========================================
  // --- Teacher Management ---
  // ==========================================
  async getVerifiedTeachers() {
    const response = await api.get("/school/teachers");
    return response.data; 
  },

  async getPendingTeachers() {
    const response = await api.get("/school/teachers/pending");
    return response.data; 
  },

  async verifyTeacher(teacherId) {
    const response = await api.patch(`/school/teachers/${teacherId}/verify`);
    return response.data;
  },

  async removeTeacherFromSchool(teacherId) {
    const response = await api.delete(`/school/teachers/${teacherId}/remove`);
    return response.data;
  }
};

export default schoolService;