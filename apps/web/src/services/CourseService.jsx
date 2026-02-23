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

const buildRequestConfig = (payload) => {
  const headers = { ...getAuthHeaders() };
  const isFormDataPayload =
    typeof FormData !== "undefined" && payload instanceof FormData;

  if (!isFormDataPayload) {
    return { headers };
  }

  return {
    headers,
    transformRequest: [
      (data, requestHeaders) => {
        if (requestHeaders) {
          delete requestHeaders["Content-Type"];
          if (requestHeaders.common) {
            delete requestHeaders.common["Content-Type"];
          }
          if (requestHeaders.post) {
            delete requestHeaders.post["Content-Type"];
          }
          if (requestHeaders.put) {
            delete requestHeaders.put["Content-Type"];
          }
        }
        return data;
      },
    ],
  };
};

const courseService = {
  async getAllCourses() {
    const response = await api.get(coursePath(), { headers: getAuthHeaders() });
    return response.data;
  },

  async createCourse(courseData) {
    const response = await api.post(
      coursePath(),
      courseData,
      buildRequestConfig(courseData),
    );
    return response.data;
  },

  async updateCourse(id, courseData) {
    const response = await api.put(
      coursePath(id),
      courseData,
      buildRequestConfig(courseData),
    );
    return response.data;
  },

  async deleteCourse(id) {
    const response = await api.delete(coursePath(id), { headers: getAuthHeaders() });
    return response.data;
  },
};

export default courseService;