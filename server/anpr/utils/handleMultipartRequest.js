import { parsePart } from "./parsePart.js";
import { parseStringPromise } from "xml2js";
import FormData from "form-data";
import { logRawXml } from "./logger.js";

const UPSTREAM_URL = "http://192.168.0.235:7001/api/anpr-cameras/events";

export async function handleMultipartRequest(req, res) {
  try {
    const buffer = await collectBuffer(req);
    const event = await parseMultipart(
      req.headers["content-type"] || "",
      buffer,
    );

    // Если нет номера или времени — просто подтверждаем, но не шлём на upstream
    if (!event.licensePlate || !event.dateTime) {
      console.log("⚠️ Нет номера или времени, пропускаем отправку");
      res.writeHead(200);
      res.end("✅ Событие получено, но номер или время отсутствует");
      return;
    }

    const status = await forwardToUpstream(event);

    if (status >= 200 && status < 300) {
      res.writeHead(200);
      res.end(
        `✅ Успешно: номер ${event.licensePlate}, время ${event.dateTime}`,
      );
    } else {
      console.error("❌ Ошибка отправки на UPSTREAM:", status);
      res.writeHead(status || 500);
      res.end(`❌ Не удалось отправить событие, статус: ${status}`);
    }
  } catch (err) {
    console.error("❌ Ошибка обработки события:", err);
    res.writeHead(500);
    res.end("❌ Внутренняя ошибка сервера");
  }
}

function collectBuffer(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

async function forwardToUpstream(event) {
  const form = new FormData();

  if (event.ipAddress) form.append("ipAddress", event.ipAddress);
  if (event.macAddress) form.append("macAddress", event.macAddress);

  form.append("licensePlate", event.licensePlate);
  form.append("dateTime", event.dateTime);

  if (event.direction) {
    form.append("direction", event.direction);
  }

  if (event.imageBody) {
    form.append("image", event.imageBody, {
      filename: `plate_${Date.now()}.jpg`,
      contentType: "image/jpeg",
    });
  }

  const formBuffer = form.getBuffer();

  const response = await fetch(UPSTREAM_URL, {
    method: "POST",
    headers: {
      ...form.getHeaders(),
      "Content-Length": formBuffer.length,
    },
    body: formBuffer,
  });

  return response.status;
}

async function parseMultipart(contentType, buffer) {
  const boundaryMatch = contentType.match(/boundary=(.+)$/);
  if (!boundaryMatch) return {};

  const boundary = boundaryMatch[1];
  const rawParts = buffer
    .toString("binary")
    .split(`--${boundary}`)
    .slice(1, -1);

  let licensePlate = "";
  let dateTime = "";
  let ipAddress = "";
  let macAddress = "";
  let direction = "";
  let imageBody = null;

  for (const raw of rawParts) {
    const part = Buffer.from(raw.trim(), "binary");
    const parsed = parsePart(part);
    if (!parsed) continue;

    const { rawHeader, body } = parsed;

    if (rawHeader.includes("anpr.xml")) {
      ({ licensePlate, dateTime, ipAddress, macAddress, direction } =
        await parseAnprXml(body));
    }

    if (rawHeader.includes("detectionPicture") && !imageBody) {
      imageBody = body;
    }
  }

  return {
    licensePlate,
    dateTime,
    imageBody,
    ipAddress,
    macAddress,
    direction,
  };
}

async function parseAnprXml(body) {
  const raw = body.toString("utf8");
  logRawXml(raw);
  try {
    const parsed = await parseStringPromise(body.toString("utf8"), {
      explicitArray: false,
    });
    const alert = parsed["EventNotificationAlert"];

    const licensePlate = alert?.ANPR?.licensePlate || "";
    const dateTime = alert?.dateTime || "";
    const ipAddress = alert?.ipAddress || "";
    const macAddress = alert?.macAddress || "";
    const direction = alert?.ANPR?.direction || "";

    console.log(
      "🚗 Номер:",
      licensePlate,
      "🕒 Время:",
      dateTime,
      "➡️ Direction:",
      direction,
    );

    return { licensePlate, dateTime, ipAddress, macAddress, direction };
  } catch (err) {
    console.error("❌ Ошибка парсинга XML:", err);
    return {
      licensePlate: "",
      dateTime: "",
      ipAddress: "",
      macAddress: "",
      direction: "",
    };
  }
}
