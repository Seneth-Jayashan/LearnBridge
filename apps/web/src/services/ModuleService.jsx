import api from "../api/Axios";

const hasApiV1InBaseUrl = () => {
  const baseURL = api?.defaults?.baseURL || "";
  return /\/api\/v1\/?$/i.test(baseURL);
};

const modulePath = (id = "") => {
  const prefix = hasApiV1InBaseUrl() ? "" : "/api/v1";
  return `${prefix}/modules${id ? `/${id}` : ""}`;
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

const moduleService = {
  async getAllModules() {
    const response = await api.get(modulePath(), { headers: getAuthHeaders() });
    return response.data;
  },

  async createModule(moduleData) {
    const response = await api.post(
      modulePath(),
      moduleData,
      buildRequestConfig(moduleData),
    );
    return response.data;
  },

  async getModuleById(id) {
    const response = await api.get(modulePath(id), {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  async updateModule(id, moduleData) {
    const response = await api.put(
      modulePath(id),
      moduleData,
      buildRequestConfig(moduleData),
    );
    return response.data;
  },

  async deleteModule(id) {
    const response = await api.delete(modulePath(id), {
      headers: getAuthHeaders(),
    });
    return response.data;
  },
};

export default moduleService;
