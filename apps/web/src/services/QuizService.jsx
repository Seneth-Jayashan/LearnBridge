import api from "../api/Axios";

const quizService = {
  // ─── TEACHER SERVICES ───────────────────────────────────────────────

  async createQuiz(quizData) {
    const response = await api.post("/quizzes", quizData);
    return response.data;
  },

  async getTeacherQuizzes() {
    const response = await api.get("/quizzes/my-quizzes");
    return response.data;
  },

  async updateQuiz(id, quizData) {
    const response = await api.put(`/quizzes/${id}`, quizData);
    return response.data;
  },

  async deleteQuiz(id) {
    const response = await api.delete(`/quizzes/${id}`);
    return response.data;
  },

  async publishQuiz(id) {
    const response = await api.put(`/quizzes/${id}`, { isPublished: true });
    return response.data;
  },

  // ─── STUDENT SERVICES ───────────────────────────────────────────────

  async getQuizzesByModule(moduleId) {
    const response = await api.get(`/quizzes/module/${moduleId}`);
    return response.data;
  },

  async getQuizById(id) {
    const response = await api.get(`/quizzes/${id}`);
    return response.data;
  },

  async submitQuiz(id, payload) {
    const response = await api.post(`/quizzes/${id}/submit`, payload);
    return response.data;
  },

  async getStudentResults() {
    const response = await api.get("/quizzes/results/my");
    return response.data;
  },
};

export default quizService;