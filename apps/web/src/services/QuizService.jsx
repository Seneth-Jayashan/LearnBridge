import api from "../api/Axios";

// ─── TEACHER SERVICES ───────────────────────────────────────────────

export const createQuiz = (quizData) =>
  api.post("/quizzes", quizData);

export const getTeacherQuizzes = () =>
  api.get("/quizzes/my-quizzes");

export const updateQuiz = (id, quizData) =>
  api.put(`/quizzes/${id}`, quizData);

export const deleteQuiz = (id) =>
  api.delete(`/quizzes/${id}`);

export const publishQuiz = (id) =>
  api.put(`/quizzes/${id}`, { isPublished: true });

// ─── STUDENT SERVICES ───────────────────────────────────────────────

export const getQuizzesByCourse = (courseId) =>
  api.get(`/quizzes/course/${courseId}`);

export const getQuizById = (id) =>
  api.get(`/quizzes/${id}`);

export const submitQuiz = (id, payload) =>
  api.post(`/quizzes/${id}/submit`, payload);

export const getStudentResults = () =>
  api.get("/quizzes/results/my");