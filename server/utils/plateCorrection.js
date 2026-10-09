// Правила исправления номера, распознанного камерой (слой 1, без ИИ).
// Форматы совпадают с formatLicensePlate: «01A123BC», «01123ABC» и «01M017910» (зелёный, совместные предприятия).

// Что OCR путает: символ → на что заменить, если на этой позиции нужна цифра / буква.
const TO_DIGIT = { O: "0", Q: "0", D: "0", I: "1", L: "1", Z: "2", S: "5", G: "6", B: "8" };
const TO_LETTER = { 0: "O", 1: "I", 2: "Z", 5: "S", 6: "G", 8: "B" };

// D = цифра, L = буква
const TEMPLATES = ["DDLDDDLL", "DDDDDLLL", "DDLDDDDDD"];

const PLATE_FORMATS = [/^\d{2}[A-Z]\d{3}[A-Z]{2}$/, /^\d{5}[A-Z]{3}$/, /^\d{2}[A-Z]\d{6}$/];

export function normalizePlate(raw) {
  return String(raw ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

export function isValidPlate(plate) {
  return PLATE_FORMATS.some((re) => re.test(plate));
}

// Подгоняет символы под шаблон. null — если какой-то символ не удалось привести.
function fitTemplate(plate, template) {
  if (plate.length !== template.length) return null;
  let changes = 0;
  let out = "";
  for (let i = 0; i < template.length; i++) {
    const ch = plate[i];
    const needDigit = template[i] === "D";
    const isDigit = /\d/.test(ch);
    if (needDigit === isDigit) {
      out += ch;
      continue;
    }
    const fixed = needDigit ? TO_DIGIT[ch] : TO_LETTER[ch];
    if (!fixed) return null;
    out += fixed;
    changes++;
  }
  return { plate: out, changes };
}

// Возвращает { plate, raw, corrected, valid }.
// Исправляем только когда подошёл ровно один шаблон — иначе угадывать нельзя,
// номер остаётся как есть (деньги на кону, лучше не трогать).
export function correctPlate(raw) {
  const normalized = normalizePlate(raw);

  if (isValidPlate(normalized)) {
    return { plate: normalized, raw, corrected: normalized !== raw, valid: true };
  }

  const fits = TEMPLATES.map((t) => fitTemplate(normalized, t)).filter(Boolean);
  if (fits.length === 1) {
    return { plate: fits[0].plate, raw, corrected: true, valid: true };
  }

  return { plate: normalized || raw, raw, corrected: normalized !== raw, valid: false };
}

export function levenshtein(a, b) {
  if (a === b) return 0;
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diagonal = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j];
      prev[j] = Math.min(
        prev[j] + 1,
        prev[j - 1] + 1,
        diagonal + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      diagonal = tmp;
    }
  }
  return prev[b.length];
}

// Один и тот же проезд камера шлёт 2–5 раз с чуть разными номерами.
export const DUPLICATE_WINDOW_SEC = 10;

export function isSamePlate(a, b) {
  return a === b || (a.length === b.length && levenshtein(a, b) <= 1);
}
