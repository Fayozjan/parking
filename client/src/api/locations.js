import api from "./instance";

export const getLocations = async (params = {}) => {
  const res = await api.get("/locations", { params });
  return {
    data: res.data.data,
    pagination: res.data.pagination,
  };
};

export const getActiveLocations = async () => {
  const res = await api.get("/locations/active");
  return {
    success: res.data.success,
    data: res.data.data,
  };
};

export const addLocation = async (data) => {
  const res = await api.post("/locations", data);
  return {
    data: res.data.result,
    success: res.data.success,
  };
};

export const getLocation = async (id) => {
  const res = await api.get(`/locations/${id}`);
  return {
    data: res.data.data,
    success: res.data.success,
  };
};

export const editLocation = async (id, data) => {
  const res = await api.put(`/locations/${id}`, data);
  return {
    data: res.data.result,
    success: res.data.success,
  };
};

export const deleteLocationById = async (id) => {
  if (!id) throw new Error("ID не передан");

  const res = await api.delete(`/locations/${id}`);

  return {
    success: res.data.success,
    message: res.data.message || "Локация удалена",
  };
};

export const getLocationTariffHistory = async (locationId) => {
  const res = await api.get(`/locations/${locationId}/tariff-history`);
  return { success: res.data.success, data: res.data.data };
};

export const addLocationTariffHistory = async (locationId, data) => {
  const res = await api.post(`/locations/${locationId}/tariff-history`, data);
  return { success: res.data.success, data: res.data.data };
};

export const updateLocationTariffHistory = async (locationId, historyId, data) => {
  const res = await api.put(`/locations/${locationId}/tariff-history/${historyId}`, data);
  return { success: res.data.success, data: res.data.data };
};

export const deleteLocationTariffHistory = async (locationId, historyId) => {
  const res = await api.delete(`/locations/${locationId}/tariff-history/${historyId}`);
  return { success: res.data.success };
};
