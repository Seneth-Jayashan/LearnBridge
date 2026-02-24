import api from "../api/Axios";

const hasApiV1InBaseUrl = () => {
  const baseURL = api?.defaults?.baseURL || "";
  return /\/api\/v1\/?$/i.test(baseURL);
};

const lessonPath = (id = "") => {
  const prefix = hasApiV1InBaseUrl() ? "" : "/api/v1";
  return `${prefix}/lessons${id ? `/${id}` : ""}`;
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

const lessonService = {
  async getAllLessons(moduleId = "") {
    const endpoint = moduleId
      ? `${lessonPath()}?module=${encodeURIComponent(moduleId)}`
      : lessonPath();
    const response = await api.get(endpoint, { headers: getAuthHeaders() });
    return response.data;
  },

  async createLesson(lessonData) {
    const response = await api.post(
      lessonPath(),
      lessonData,
      buildRequestConfig(lessonData),
    );
    return response.data;
  },

  async updateLesson(id, lessonData) {
    const response = await api.put(
      lessonPath(id),
      lessonData,
      buildRequestConfig(lessonData),
    );
    return response.data;
  },

  async deleteLesson(id) {
    const response = await api.delete(lessonPath(id), { headers: getAuthHeaders() });
    return response.data;
  },
};

export default lessonService;
