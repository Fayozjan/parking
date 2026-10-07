import * as XLSX from "xlsx";

const fmtDate = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const fmtDuration = (minutes) => {
  if (minutes == null) return "";
  if (minutes < 60) return `${minutes} мин`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}ч ${m}мин` : `${h}ч`;
};

const fmtPlate = (plate) => {
  if (!plate) return "";
  const s = plate.toUpperCase().replace(/\s+/g, "");
  const priv = s.match(/^(\d{2})([A-Z])(\d{3})([A-Z]{2})$/);
  if (priv) return `${priv[1]} ${priv[2]} ${priv[3]} ${priv[4]}`;
  const corp = s.match(/^(\d{2})(\d{3})([A-Z]{3})$/);
  if (corp) return `${corp[1]} ${corp[2]} ${corp[3]}`;
  return plate;
};

const round = (n) => (n == null ? "" : Math.round(n));

export function exportFinanceExcel({ data, locationSessions, range, currency, t }) {
  const wb = XLSX.utils.book_new();
  const { locations } = data;

  const summarySheet = XLSX.utils.aoa_to_sheet([
    [
      "№",
      t("name"),
      t("financeParkings"),
      `${t("financeRevenue")} (${currency})`,
      `${t("financeTariff")} (${currency})`,
      `${t("financeAvgPerDay")} (${currency})`,
    ],
    ...locations.map((loc, i) => [
      i + 1,
      loc.name,
      loc.parkings ?? 0,
      round(loc.revenue),
      loc.tariff ? round(loc.tariff.base_price) : "",
      round(loc.avgPerDay),
    ]),
  ]);
  summarySheet["!cols"] = [
    { wch: 4 },
    { wch: 32 },
    { wch: 12 },
    { wch: 20 },
    { wch: 16 },
    { wch: 16 },
  ];
  XLSX.utils.book_append_sheet(wb, summarySheet, t("financeSummary") || "Сводка");

  locations.forEach((loc) => {
    const sessions = locationSessions[loc.id] ?? [];
    const sheet = XLSX.utils.aoa_to_sheet([
      [
        "№",
        t("plateNumber"),
        t("entry"),
        t("exit"),
        t("parkingDuration"),
        `${t("financePrice")} (${currency})`,
      ],
      ...sessions.map((s, i) => [
        i + 1,
        fmtPlate(s.plate_number),
        fmtDate(s.entry_time),
        s.is_open ? t("parkingOpen") : fmtDate(s.exit_time),
        fmtDuration(s.duration_minutes),
        s.is_open || s.is_no_tariff || s.is_free_period || !loc.tariff ? "" : round(loc.tariff.base_price),
      ]),
    ]);
    sheet["!cols"] = [
      { wch: 4 },
      { wch: 15 },
      { wch: 18 },
      { wch: 18 },
      { wch: 14 },
      { wch: 14 },
    ];
    const sheetName = (loc.name || `loc_${loc.id}`)
      .slice(0, 31)
      .replace(/[:\\/?*[\]]/g, "_")
      .trim();
    XLSX.utils.book_append_sheet(wb, sheet, sheetName || `loc_${loc.id}`);
  });

  XLSX.writeFile(wb, `finance_${range.from}_${range.to}.xlsx`);
}
