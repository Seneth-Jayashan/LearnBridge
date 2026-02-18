import api from "../api/Axios";

const schoolService = {
  // --- Dashboard Data ---
  async getMySchoolDetails() {
    const response = await api.get("/school/my-school");
    return response.data; // Returns School object populated with refs
  },

  // --- Student Management ---
  async createStudent(studentData) {
    const response = await api.post("/school/create-student", studentData);
    return response.data;
  },

  // --- Teacher Verification ---
  async getPendingTeachers() {
    const response = await api.get("/school/teachers/pending");
    return response.data; // Returns array of unverified teachers
  },

  async verifyTeacher(teacherId) {
    const response = await api.patch(`/school/teachers/verify/${teacherId}`);
    return response.data;
  }
};

export default schoolService;