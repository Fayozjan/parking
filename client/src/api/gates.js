import api from "./instance";

export const gatesApi = {
  get: async (params = {}) => {
    const res = await api.get("/gates", { params });
    return {
      data: res.data.data,
      pagination: res.data.pagination,
    };
  },

  getById: async (id) => {
    const res = await api.get(`/gates/${id}`);
    return {
      data: res.data.data,
      success: res.data.success,
    };
  },

  add: async (data) => {
    const res = await api.post("/gates", data);
    return {
      data: res.data.result,
      success: res.data.success,
    };
  },

  update: async (id, data) => {
    const res = await api.put(`/gates/${id}`, data);
    return {
      data: res.data.result,
      success: res.data.success,
    };
  },

  delete: async (id) => {
    const res = await api.delete(`/gates/${id}`);
    return { success: res.data.success };
  },
};
