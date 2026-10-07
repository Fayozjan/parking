import api from "./instance";

export const locationTariffsApi = {
  getAll: async (params = {}) => {
    const res = await api.get("/location-tariffs", { params });
    return { success: res.data.success, data: res.data.data };
  },

  getById: async (id) => {
    const res = await api.get(`/location-tariffs/${id}`);
    return { success: res.data.success, data: res.data.data };
  },

  create: async (body) => {
    const res = await api.post("/location-tariffs", body);
    return { success: res.data.success, data: res.data.data };
  },

  update: async (id, body) => {
    const res = await api.put(`/location-tariffs/${id}`, body);
    return { success: res.data.success, data: res.data.data };
  },

  remove: async (id) => {
    const res = await api.delete(`/location-tariffs/${id}`);
    return { success: res.data.success };
  },
};
