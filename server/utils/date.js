// "YYYY-MM-DDTHH:mm" из <input type="datetime-local"> — без смещения.
// Node распарсил бы её как время сервера, поэтому явно ставим зону парковки (+05:00).
const NAIVE_DATETIME = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2})?(\.\d+)?$/;

export const parseTashkentDateTime = (value) => {
  if (value instanceof Date) return value;
  if (typeof value !== "string") return new Date(value);

  const trimmed = value.trim();
  if (!NAIVE_DATETIME.test(trimmed)) return new Date(trimmed);

  const [datePart, timePart] = trimmed.replace(" ", "T").split("T");
  const [hh, mm, ss = "00"] = timePart.split(":");

  return new Date(`${datePart}T${hh}:${mm}:${ss}+05:00`);
};

// Добавляем часы и минут к числу
export const parseDateForDB = (dateStr, isEndOfDay = false) => {
  if (isEndOfDay) {
    return `${dateStr}T23:59:59+05:00`;
  } else {
    return `${dateStr}T00:00:00+05:00`;
  }
};
