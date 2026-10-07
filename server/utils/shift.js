const TIMEZONE = "Asia/Tashkent";
const TIME_RE = /^\d{2}:\d{2}$/;

// "HH:mm" по времени парковки для указанного момента
export function getTashkentTime(date = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: TIMEZONE,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
      .formatToParts(date)
      .map((p) => [p.type, p.value]),
  );
  return `${parts.hour}:${parts.minute}`;
}

function toMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

// Рабочая смена локации задаётся обеими границами. Если хотя бы одна не указана
// (или границы совпадают) — локация работает круглосуточно, ограничения нет.
// shift_start > shift_end означает смену через полночь: 22:00 → 06:00.
export function isWithinShift(location, date = new Date()) {
  const start = location?.shift_start;
  const end = location?.shift_end;

  if (!TIME_RE.test(start ?? "") || !TIME_RE.test(end ?? "")) return true;

  const s = toMinutes(start);
  const e = toMinutes(end);
  if (s === e) return true;

  const now = toMinutes(getTashkentTime(date));

  return s < e ? now >= s && now < e : now >= s || now < e;
}
