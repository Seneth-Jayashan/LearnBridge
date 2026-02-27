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
  /**
   * params: { moduleId?, q?, grade? }
   */
  async getAllLessons(params = {}) {
    const query = new URLSearchParams();
    if (params.moduleId) query.set("module", params.moduleId);
    if (params.q) query.set("q", params.q);
    if (params.grade) query.set("grade", params.grade);
    const endpoint = query.toString() ? `${lessonPath()}?${query.toString()}` : lessonPath();
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

  async getMaterialDownloadUrl(id) {
    const response = await api.get(`${lessonPath(id)}/material-download`, {
      headers: getAuthHeaders(),
    });
    return {
      downloadUrl: response.data?.downloadUrl || "",
      fileName: response.data?.fileName || "",
    };
  },

  async getVideoDownloadUrl(id) {
    const response = await api.get(`${lessonPath(id)}/video-download`, {
      headers: getAuthHeaders(),
    });
    return {
      downloadUrl: response.data?.downloadUrl || "",
      fileName: response.data?.fileName || "",
    };
  },
};

export default lessonService;
