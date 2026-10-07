import "dotenv/config";
import path from "path";
import fetch from "digest-fetch";
import pool from "../db.js";
import { internalIpV4 } from "internal-ip";
import { config } from "../config.js";
import { createTempToken } from "../middlewares/tempPhotoToken.js";

import axios from "axios";

const serverIp = await internalIpV4();
const username = "admin";
const password = process.env.PASSWORD;
const client = new fetch(username, password);

const api_get_users = "/ISAPI/AccessControl/UserInfo/Search?format=json";
const api_edit_user = "/ISAPI/AccessControl/UserInfo/SetUp?format=json";
const api_edit_user_photo = "/ISAPI/Intelligent/FDLib/FDSetUp?format=json";
const api_delete_user =
  "/ISAPI/AccessControl/UserInfoDetail/Delete?format=json";

export const RemoteFaceDeviceClient = {
  apiKey: "ykED51zjLL",
  apiSecret: "qVbE912Yuy",

  accessToken: null,
  tokenExpireTime: 0,
  domain: null,

  // 🔐 Получение токена
  async getToken() {
    try {
      const response = await axios.post(
        "https://api.hik-partnerru.com/api/hpcgw/v1/token/get",
        {
          appKey: this.apiKey,
          secretKey: this.apiSecret,
        },
      );

      if (response.data.errorCode !== "0") {
        throw new Error(response.data.message || "Token error");
      }

      const data = response.data.data;

      this.accessToken = data.accessToken;
      this.tokenExpireTime = Date.now() + data.expireTime - 60000;

      this.domain = data.areaDomain.startsWith("http")
        ? data.areaDomain
        : `https://${data.areaDomain}`;

      return true;
    } catch (error) {
      throw new Error(
        error.response?.data?.message ||
          error.response?.data ||
          error.message ||
          "Token request failed",
      );
    }
  },

  // 🔄 Проверка токена
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

  // ➕ Добавление / обновление пользователя
  async addUserToDevice(employeeNo, name, deviceSerial) {
    return this.callWithRetry(async () => {
      await this.ensureToken();

      const url = `${this.domain}/api/hpcgw/v1/device/transparent/ISAPI/AccessControl/UserInfo/SetUp?format=json`;

      const data = {
        UserInfo: {
          employeeNo,
          name,
          userType: "normal",
          Valid: {
            enable: true,
            beginTime: "2024-01-01T00:00:00",
            endTime: "2037-12-31T23:59:59",
            timeType: "local",
          },
          doorRight: "1",
          RightPlan: [
            {
              doorNo: 1,
              planTemplateNo: "1",
            },
          ],
        },
      };

      try {
        const response = await axios.put(url, data, {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "X-Devserial": deviceSerial,
            "Content-Type": "application/json",
          },
        });

        if (response.data.errorCode && response.data.errorCode !== "0") {
          throw new Error(response.data.message || "User API error");
        }

        const status = response.data.ResponseStatus || response.data;

        if (status.statusCode !== 1 && status.statusString !== "OK") {
          throw new Error(
            status.subStatusCode ||
              status.statusString ||
              "Device rejected user setup",
          );
        }

        return true;
      } catch (error) {
        throw new Error(
          error.response?.data?.message ||
            error.response?.data?.ResponseStatus?.subStatusCode ||
            error.response?.data ||
            error.message ||
            "User setup failed",
        );
      }
    });
  },

  // 📷 Добавление фото
  async addUserPhotoToDevice(
    employeeNo,
    name,
    deviceSerial,
    photoPath,
    tenant,
  ) {
    return this.callWithRetry(async () => {
      await this.ensureToken();

      const url = `${this.domain}/api/hpcgw/v1/device/transparent/ISAPI/Intelligent/FDLib/FDSetUp?format=json`;

      const filePath = path.join(
        process.cwd(),
        "uploads",
        "employees",
        photoPath,
      );
      const token = createTempToken(filePath);
      const photoUrl = `https://${tenant}.onbase.uz/api/employees/photo/${token}`;

      const data = {
        faceURL: photoUrl,
        faceLibType: "blackFD",
        FDID: "1",
        FPID: String(employeeNo),
        name: name,
        bornTime: "1990-01-01T00:00:00Z",
        saveFacePic: true,
      };

      try {
        const response = await axios.put(url, data, {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "X-Devserial": deviceSerial,
            "Content-Type": "application/json",
          },
        });

        if (response.data.errorCode && response.data.errorCode !== "0") {
          throw new Error(response.data.message || "Photo API error");
        }

        const status = response.data.ResponseStatus || response.data;

        if (status.statusCode !== 1 && status.statusString !== "OK") {
          throw new Error(
            status.subStatusCode ||
              status.statusString ||
              "Device rejected photo",
          );
        }

        return true;
      } catch (error) {
        throw new Error(
          error.response?.data?.message ||
            error.response?.data?.ResponseStatus?.subStatusCode ||
            error.response?.data ||
            error.message ||
            "Photo upload failed",
        );
      }
    });
  },

  async getUsers(deviceSerial) {
    return this.callWithRetry(async () => {
      await this.ensureToken();
      const url = `${this.domain}/api/hpcgw/v1/device/transparent/ISAPI/AccessControl/UserInfo/Search?format=json`;
      const users = [];
      let position = 0;
      let hasMore = true;

      while (hasMore) {
        try {
          const response = await axios.post(
            url,
            {
              UserInfoSearchCond: {
                searchID: "1",
                searchResultPosition: position,
                maxResults: 30,
              },
            },
            {
              headers: {
                Authorization: `Bearer ${this.accessToken}`,
                "X-Devserial": deviceSerial,
                "Content-Type": "application/json",
              },
            },
          );
          if (response.data.errorCode && response.data.errorCode !== "0") {
            if (this.isTokenExpiredError(response.data))
              throw new Error(response.data.message);
            break;
          }
          const items = response.data?.UserInfoSearch?.UserInfo || [];
          users.push(
            ...items.map((u) => ({
              employeeNo: u.employeeNo,
              name: u.name || "",
            })),
          );
          hasMore =
            response.data?.UserInfoSearch?.responseStatusStrg === "MORE";
          if (hasMore) position += items.length;
          else break;
        } catch (err) {
          if (this.isTokenExpiredError(err)) throw err;
          break;
        }
      }
      return users;
    });
  },

  // 📋 Получение событий доступа
  async getEvents(deviceSerial, startTime, endTime) {
    return this.callWithRetry(async () => {
      await this.ensureToken();

      const url = `${this.domain}/api/hpcgw/v1/device/transparent/ISAPI/AccessControl/AcsEvent?format=json`;
      const allEvents = [];
      let position = 0;

      while (true) {
        let response;
        try {
          response = await axios.post(
            url,
            {
              AcsEventCond: {
                searchID: "1",
                searchResultPosition: position,
                maxResults: 100,
                major: 5,
                minor: 75,
                startTime,
                endTime,
                picEnable: false,
              },
            },
            {
              headers: {
                Authorization: `Bearer ${this.accessToken}`,
                "X-Devserial": deviceSerial,
                "Content-Type": "application/json",
              },
              timeout: 20000,
            },
          );
        } catch (err) {
          if (this.isTokenExpiredError(err)) throw err;
          console.warn(
            `⚠️ [remote:${deviceSerial}] getEvents error: ${err.message}`,
          );
          break;
        }

        if (response.data.errorCode && response.data.errorCode !== "0") {
          if (this.isTokenExpiredError(response.data))
            throw new Error(response.data.message);
          console.warn(
            `⚠️ [remote:${deviceSerial}] API error: ${response.data.message}`,
          );
          break;
        }

        const batch = response.data?.AcsEvent?.InfoList || [];
        if (!batch.length) break;

        allEvents.push(...batch);
        position += batch.length;
      }

      return allEvents;
    });
  },

  // ❌ Удаление пользователя
  async deleteUserFromDevice(employeeNo, deviceSerial) {
    return this.callWithRetry(async () => {
      await this.ensureToken();

      const url = `${this.domain}/api/hpcgw/v1/device/transparent/ISAPI/AccessControl/UserInfo/Delete?format=json`;

      const data = {
        UserInfoDelCond: {
          EmployeeNoList: [{ employeeNo }],
        },
      };

      try {
        const response = await axios.put(url, data, {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "X-Devserial": deviceSerial,
            "Content-Type": "application/json",
          },
        });

        if (response.data.errorCode && response.data.errorCode !== "0") {
          throw new Error(response.data.message || "Delete API error");
        }

        const status = response.data.ResponseStatus || response.data;

        if (status.statusCode !== 1 && status.statusString !== "OK") {
          throw new Error(
            status.subStatusCode ||
              status.statusString ||
              "Device rejected delete",
          );
        }

        return true;
      } catch (error) {
        throw new Error(
          error.response?.data?.message ||
            error.response?.data?.ResponseStatus?.subStatusCode ||
            error.response?.data ||
            error.message ||
            "User delete failed",
        );
      }
    });
  },
};
