import api from "../api/Axios";

const hasApiV1InBaseUrl = () => {
  const baseURL = api?.defaults?.baseURL || "";
  return /\/api\/v1\/?$/i.test(baseURL);
};

const coursePath = (id = "") => {
  const prefix = hasApiV1InBaseUrl() ? "" : "/api/v1";
  return `${prefix}/courses${id ? `/${id}` : ""}`;
};

const getAuthHeaders = () => {
  const token = localStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const courseService = {
  async getAllCourses() {
    const response = await api.get(coursePath(), { headers: getAuthHeaders() });
    return response.data;
  },

  async createCourse(courseData) {
    const headers = {
      ...getAuthHeaders(),
    };
    const response = await api.post(coursePath(), courseData, { headers });
    return response.data;
  },

  async updateCourse(id, courseData) {
    const headers = {
      ...getAuthHeaders(),
    };
    const response = await api.put(coursePath(id), courseData, { headers });
    return response.data;
  },

  async deleteCourse(id) {
    const response = await api.delete(coursePath(id), { headers: getAuthHeaders() });
    return response.data;
  },
};

export default courseService;