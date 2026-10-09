// Рейтинг достоверности фиксации: шкала 0–100.
// База — уверенность камеры (confidence распознавания), плюс бонус, если тот же номер
// увидела и вторая камера ворот.
export const GATE_CONFIRM_BONUS = 15;

export const calcPassScore = (confidence, gateConfirmed) => {
  if (confidence === null || confidence === undefined) return null;
  const base = Math.min(100, Math.max(0, Math.round(Number(confidence))));
  return Math.min(100, base + (gateConfirmed ? GATE_CONFIRM_BONUS : 0));
};
