import api from "../api/Axios";

const hasApiV1InBaseUrl = () => {
  const baseURL = api?.defaults?.baseURL || "";
  return /\/api\/v1\/?$/i.test(baseURL);
};

const levelPath = (suffix = "") => {
  const prefix = hasApiV1InBaseUrl() ? "" : "/api/v1";
  return `${prefix}/levels${suffix}`;
};

const systemDefaultLevels = [
  { name: "Primary Education", description: "Grade 1 – 5" },
  { name: "Junior Secondary", description: "Grade 6 – 9" },
  { name: "Senior Secondary – G.C.E. O/L", description: "Grade 10 – 11" },
  { name: "Advanced Level – G.C.E. A/L", description: "Grade 12 – 13" },
];

const getAuthHeaders = () => {
  const token = localStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const levelService = {
  async getAllLevels() {
    const response = await api.get(levelPath(), { headers: getAuthHeaders() });
    return response.data;
  },

  async createLevel(levelData) {
    const response = await api.post(levelPath(), levelData, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  async getLevelById(id) {
    const response = await api.get(levelPath(`/${id}`), {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  async updateLevel(id, levelData) {
    const response = await api.put(levelPath(`/${id}`), levelData, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  async deleteLevel(id) {
    const response = await api.delete(levelPath(`/${id}`), {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  async syncDefaultLevels() {
    const existingLevels = await this.getAllLevels();
    const existingNames = new Set(
      (Array.isArray(existingLevels) ? existingLevels : [])
        .map((level) => (level?.name || "").trim().toLowerCase())
        .filter(Boolean),
    );

    let created = 0;
    let skipped = 0;

    for (const level of systemDefaultLevels) {
      const key = level.name.trim().toLowerCase();
      if (existingNames.has(key)) {
        skipped += 1;
        continue;
      }

      await this.createLevel(level);
      existingNames.add(key);
      created += 1;
    }

    return {
      message: "Default levels synced successfully",
      created,
      updated: 0,
      skipped,
    };
  },
};

export default levelService;
