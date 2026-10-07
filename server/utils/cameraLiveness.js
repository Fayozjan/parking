import DigestFetch from "digest-fetch";
import { HikConnectAnprClient } from "./hikvisionIsapi.js";

const PROBE_TIMEOUT_MS = 4000;
const PROBE_PATH = "/ISAPI/System/deviceInfo?format=json";

async function probeLocalCamera(camera) {
  if (!camera.camera_ip) return false;
  const url = `http://${camera.camera_ip}:${camera.port || 80}${PROBE_PATH}`;
  const client = new DigestFetch(camera.username || "", camera.password || "");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);

  try {
    await client.fetch(url, { signal: controller.signal });
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

// Один снимок статусов Hik-Connect на всю пачку камер — вместо отдельного запроса списка устройств на каждую камеру
export async function fetchCloudStatusMap() {
  try {
    return await HikConnectAnprClient.getOnlineStatusMap();
  } catch (err) {
    console.error("[CameraLiveness] Hik-Connect status fetch failed:", err.message);
    return new Map();
  }
}

// true — камера доступна, false — недоступна, null — статус определить не удалось (данных недостаточно)
// Локальные камеры проверяются напрямую по ISAPI; при неудаче (и для нелокальных камер, доступных только через Hik-Connect) — статус подтверждается через Hik-Connect
export async function isCameraReachable(camera, cloudStatusMap) {
  if (camera.is_local && (await probeLocalCamera(camera))) return true;

  if (!camera.serial_number) return camera.is_local ? false : null;

  const map = cloudStatusMap || (await fetchCloudStatusMap());
  if (map.has(camera.serial_number)) return map.get(camera.serial_number);

  return camera.is_local ? false : null;
}
