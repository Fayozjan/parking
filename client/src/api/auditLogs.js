import api from "./instance";

export const getAuditLogs = async (params = {}) => {
  const res = await api.get("/audit-logs", { params });
  return {
    data: res.data.data,
    pagination: res.data.pagination,
  };
};

export const getAuditUsers = async () => {
  const res = await api.get("/audit-logs/users");
  return {
    data: res.data.data,
  };
};

export const getAuditEntities = async () => {
  const res = await api.get("/audit-logs/entities");
  return {
    data: res.data.data,
  };
};

export const restoreAuditLog = async (id) => {
  const res = await api.post(`/audit-logs/${id}/restore`);
  return {
    data: res.data.data,
  };
};

export const restoreAuditLogs = async (ids) => {
  const res = await api.post("/audit-logs/restore-bulk", { ids });
  return {
    data: res.data.data,
  };
};
