const CYRILLIC_TO_LATIN = {
  А: "A", В: "B", Е: "E", К: "K", М: "M", Н: "H",
  О: "O", Р: "P", С: "C", Т: "T", У: "Y", Х: "X",
};

export function normalizePlate(value) {
  if (!value) return "";
  return value
    .toUpperCase()
    .split("")
    .map((ch) => CYRILLIC_TO_LATIN[ch] ?? ch)
    .join("")
    .trim();
}
