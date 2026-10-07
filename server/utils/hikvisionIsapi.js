import axios from "axios";

const HIK_TOKEN_URL = "https://api.hik-partnerru.com/api/hpcgw/v1/token/get";
const DEVICE_LIST_URL = "/api/hpcgw/v1/device/list";
const TRANSPARENT_BASE = "/api/hpcgw/v1/device/transparent";
const ADD_PLATE_PATH = `${TRANSPARENT_BASE}/ISAPI/Traffic/channels/1/AddLicensePlateAuditData?format=json`;
const DEL_PLATE_PATH = `${TRANSPARENT_BASE}/ISAPI/Traffic/channels/1/DelLicensePlateAuditData?format=json`;
const QUERY_PLATE_PATH = `${TRANSPARENT_BASE}/ISAPI/Traffic/channels/1/licensePlateAuditData/record?format=json`;

export const HikConnectAnprClient = {
  apiKey: process.env.HIK_API_KEY,
  apiSecret: process.env.HIK_API_SECRET,

  accessToken: null,
  tokenExpireTime: 0,
  domain: null,

  async getToken() {
    const response = await axios.post(HIK_TOKEN_URL, {
      appKey: this.apiKey,
      secretKey: this.apiSecret,
    });

    if (response.data.errorCode !== "0") {
      throw new Error(response.data.message || "Token error");
    }

    const data = response.data.data;
    this.accessToken = data.accessToken;
    this.tokenExpireTime = Date.now() + data.expireTime - 60000;
    this.domain = data.areaDomain.startsWith("http")
      ? data.areaDomain
      : `https://${data.areaDomain}`;
  },

  async ensureToken() {
    if (!this.accessToken || Date.now() >= this.tokenExpireTime) {
      await this.getToken();
    }
  },

  isTokenExpiredError(err) {
    return (
      err?.errorCode === "LAP500004" ||
      err?.message?.includes("LAP500004") ||
      err?.response?.data?.errorCode === "LAP500004" ||
      err?.response?.data?.message?.includes("LAP500004")
    );
  },

  async callWithRetry(fn) {
    try {
      return await fn();
    } catch (err) {
      if (this.isTokenExpiredError(err)) {
        this.accessToken = null;
        this.tokenExpireTime = 0;
        await this.getToken();
        return fn();
      }
      throw err;
    }
  },

  buildHeaders(deviceSerial) {
    return {
      Authorization: `Bearer ${this.accessToken}`,
      "X-Devserial": deviceSerial,
      "Content-Type": "application/json",
    };
  },

  async getDevices(pageNo = 1, pageSize = 50) {
    return this.callWithRetry(async () => {
      await this.ensureToken();

      const url = `${this.domain}${DEVICE_LIST_URL}`;
      const response = await axios.post(url, { pageNo, pageSize }, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
        timeout: 15000,
      });

      if (response.data.errorCode && response.data.errorCode !== "0") {
        throw new Error(response.data.message || "Device list error");
      }

      return response.data.data;
    });
  },

  // Онлайн-статус устройства по serial из списка устройств Hik-Connect (true/false), null если устройство не найдено в списке
  async isDeviceOnline(deviceSerial) {
    if (!deviceSerial) return null;
    const map = await this.getOnlineStatusMap();
    return map.has(deviceSerial) ? map.get(deviceSerial) : null;
  },

  // Полный снимок онлайн-статусов всех устройств одним проходом (важно вызывать один раз на пачку камер,
  // а не по отдельному запросу на каждую — иначе параллельные запросы бьются в общий accessToken/рейт-лимит)
  async getOnlineStatusMap() {
    return this.callWithRetry(async () => {
      await this.ensureToken();

      const url = `${this.domain}${DEVICE_LIST_URL}`;
      const map = new Map();
      let pageNo = 1;
      const pageSize = 100;

      while (true) {
        const response = await axios.post(url, { pageNo, pageSize }, {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
          timeout: 15000,
        });

        if (response.data.errorCode && response.data.errorCode !== "0") {
          throw new Error(response.data.message || "Device list error");
        }

        const { rows = [], totalPage = 1 } = response.data.data || {};
        for (const row of rows) {
          map.set(row.deviceSerial, row.deviceOnlineStatus === 1);
        }

        if (pageNo >= totalPage) break;
        pageNo++;
      }

      return map;
    });
  },

  async addPlate(deviceSerial, id, plateNum) {
    return this.callWithRetry(async () => {
      await this.ensureToken();

      const url = `${this.domain}${ADD_PLATE_PATH}`;
      const data = {
        LicensePlateAuditDataParameter: {
          id,
          plateNo: plateNum,
          listType: 0,
          startTime: "2020-01-01T00:00:00Z",
          endTime: "2099-12-31T23:59:59Z",
        },
      };

      const response = await axios.put(url, data, {
        headers: this.buildHeaders(deviceSerial),
        timeout: 15000,
      });

      if (response.data.errorCode && response.data.errorCode !== "0") {
        throw new Error(response.data.message || "Add plate error");
      }

      return true;
    });
  },

  async removePlate(deviceSerial, id, plateNum) {
    return this.callWithRetry(async () => {
      await this.ensureToken();

      const url = `${this.domain}${DEL_PLATE_PATH}`;
      const data = {
        LicensePlateAuditDataParameter: {
          id,
          plateNo: plateNum,
        },
      };

      const response = await axios.put(url, data, {
        headers: this.buildHeaders(deviceSerial),
        timeout: 15000,
      });

      if (response.data.errorCode && response.data.errorCode !== "0") {
        throw new Error(response.data.message || "Delete plate error");
      }

      return true;
    });
  },

  async queryPlates(deviceSerial, pageNo = 1, pageSize = 100) {
    return this.callWithRetry(async () => {
      await this.ensureToken();

      const url = `${this.domain}${QUERY_PLATE_PATH}`;
      const data = {
        searchDescription: {
          position: (pageNo - 1) * pageSize,
          maxResults: pageSize,
        },
      };

      const response = await axios.post(url, data, {
        headers: this.buildHeaders(deviceSerial),
        timeout: 15000,
      });

      if (response.data.errorCode && response.data.errorCode !== "0") {
        throw new Error(response.data.message || "Query plates error");
      }

      return response.data;
    });
  },

  async addBatch(deviceSerial, entries) {
    const results = { success: 0, failed: 0, errors: [] };
    for (const e of entries) {
      try {
        await this.addPlate(deviceSerial, e.id, e.pattern);
        results.success++;
      } catch (err) {
        results.failed++;
        results.errors.push({ plate: e.pattern, error: err.message });
      }
    }
    return results;
  },
};

export async function syncPlateToAllCameras(cameras, id, plateNum) {
  const results = { success: [], failed: [] };

  await Promise.allSettled(
    cameras.map(async (camera) => {
      try {
        await HikConnectAnprClient.addPlate(camera.serial_number, id, plateNum);
        results.success.push(camera.serial_number);
      } catch (err) {
        console.error(`[HikConnect] Add ${plateNum} → ${camera.serial_number} failed:`, err.message);
        results.failed.push({ serial: camera.serial_number, error: err.message });
      }
    }),
  );

  return results;
}

export async function removePlateFromAllCameras(cameras, id, plateNum) {
  const results = { success: [], failed: [] };

  await Promise.allSettled(
    cameras.map(async (camera) => {
      try {
        await HikConnectAnprClient.removePlate(camera.serial_number, id, plateNum);
        results.success.push(camera.serial_number);
      } catch (err) {
        console.error(`[HikConnect] Remove ${plateNum} → ${camera.serial_number} failed:`, err.message);
        results.failed.push({ serial: camera.serial_number, error: err.message });
      }
    }),
  );

  return results;
}

export async function syncAllToCamera(camera, entries) {
  const results = { success: 0, failed: 0, errors: [] };

  const BATCH_SIZE = 20;
  for (let i = 0; i < entries.length; i += BATCH_SIZE) {
    const batch = entries.slice(i, i + BATCH_SIZE);
    try {
      await HikConnectAnprClient.addBatch(camera.serial_number, batch);
      results.success += batch.length;
    } catch {
      for (const entry of batch) {
        try {
          await HikConnectAnprClient.addPlate(camera.serial_number, entry.id, entry.pattern);
          results.success++;
        } catch (singleErr) {
          results.failed++;
          results.errors.push({ plate: entry.pattern, error: singleErr.message });
        }
      }
    }
  }

  return results;
}
