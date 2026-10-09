function extractTag(xml, tag) {
  const match = xml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`));
  return match ? match[1] : "";
}

// Направление движения транспорта относительно камеры.
// Модели Hikvision сообщают его по-разному: одни шлют <direction> в блоке ANPR,
// другие только <vehicleHead> в pictureInfo (какой стороной машина в кадре).
const MOVEMENT_DIRECTIONS = {
  forward: "forward",
  front: "forward",
  head: "forward",
  reverse: "reverse",
  back: "reverse",
  tail: "reverse",
};

export function normalizeMovementDirection(value) {
  return MOVEMENT_DIRECTIONS[String(value ?? "").trim().toLowerCase()] || null;
}

export function parseHikvisionXml(xml) {
  const direction = extractTag(xml, "direction");
  const vehicleHead = extractTag(xml, "vehicleHead");

  return {
    macAddress: extractTag(xml, "macAddress"),
    licensePlate: extractTag(xml, "licensePlate"),
    dateTime: extractTag(xml, "dateTime"),
    direction,
    vehicleHead,
    // null — камера направление не сообщила либо прислала "unknown"
    movementDirection:
      normalizeMovementDirection(direction) ??
      normalizeMovementDirection(vehicleHead),
    ipAddress: extractTag(xml, "ipAddress"),
    confidenceLevel: parseInt(extractTag(xml, "confidenceLevel") || "0", 10),
  };
}

export function formatLicensePlate(plate) {
  const m1 = plate.match(/^(\d{2})([A-Z])(\d{3})([A-Z]{2})$/i);
  if (m1) return `${m1[1]} ${m1[2]} ${m1[3]} ${m1[4]}`.toUpperCase();

  const m2 = plate.match(/^(\d{2})(\d{3})([A-Z]{3})$/i);
  if (m2) return `${m2[1]} ${m2[2]} ${m2[3]}`.toUpperCase();

  const m3 = plate.match(/^(\d{2})([A-Z])(\d{6})$/i);
  if (m3) return `${m3[1]} ${m3[2]} ${m3[3]}`.toUpperCase();

  return plate.toUpperCase();
}
