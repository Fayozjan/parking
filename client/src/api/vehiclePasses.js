import api from "./instance";

export const getVehiclePasses = async (params = {}) => {
  const res = await api.get("/vehicle-passes", { params });
  return {
    data: res.data.data,
    pagination: res.data.pagination,
  };
};

export const exportVehiclePasses = async (filters = {}) => {
  const res = await api.get("/vehicle-passes/export", {
    params: { filters },
    responseType: "blob",
  });
  return res.data;
};

const toFormData = (data, photo) => {
  const form = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value !== null && value !== undefined) form.append(key, value);
  });
  form.append("photo", photo);
  return form;
};

export const getVehiclePass = async (id) => {
  const res = await api.get(`/vehicle-passes/${id}`);
  return res.data;
};

export const createVehiclePass = async (data, photo = null) => {
  const res = await api.post(
    "/vehicle-passes",
    photo ? toFormData(data, photo) : data,
  );
  return res.data;
};

export const createVehiclePassesBulk = async (data) => {
  const res = await api.post("/vehicle-passes/bulk", data);
  return res.data;
};

export const deleteVehiclePass = async (id) => {
  const res = await api.delete(`/vehicle-passes/${id}`);
  return res.data;
};

export const updateVehiclePass = async (id, data, photo = null) => {
  const res = await api.put(
    `/vehicle-passes/${id}`,
    photo ? toFormData(data, photo) : data,
  );
  return res.data;
};
