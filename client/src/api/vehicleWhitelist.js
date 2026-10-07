import api from "./instance";

export const vehicleWhitelistApi = {
  getAll: async (params = {}) => {
    const res = await api.get("/vehicle-whitelist", { params });
    return { success: res.data.success, data: res.data.data, pagination: res.data.pagination };
  },

  getById: async (id) => {
    const res = await api.get(`/vehicle-whitelist/${id}`);
    return { success: res.data.success, data: res.data.data };
  },

  create: async (body) => {
    const res = await api.post("/vehicle-whitelist", body);
    return { success: res.data.success, data: res.data.data };
  },

  update: async (id, body) => {
    const res = await api.put(`/vehicle-whitelist/${id}`, body);
    return { success: res.data.success, data: res.data.data };
  },

  remove: async (id) => {
    const res = await api.delete(`/vehicle-whitelist/${id}`);
    return { success: res.data.success };
  },

  importFromExcel: async (file, folderId) => {
    const formData = new FormData();
    formData.append("file", file);
    if (folderId) formData.append("folder_id", folderId);
    const res = await api.post("/vehicle-whitelist/import", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return { success: res.data.success, data: res.data.data };
  },

  getFolders: async () => {
    const res = await api.get("/vehicle-whitelist/folders");
    return { success: res.data.success, data: res.data.data };
  },

  createFolder: async (body) => {
    const res = await api.post("/vehicle-whitelist/folders", body);
    return { success: res.data.success, data: res.data.data };
  },

  updateFolder: async (id, body) => {
    const res = await api.put(`/vehicle-whitelist/folders/${id}`, body);
    return { success: res.data.success, data: res.data.data };
  },

  removeFolder: async (id) => {
    const res = await api.delete(`/vehicle-whitelist/folders/${id}`);
    return { success: res.data.success };
  },
};
