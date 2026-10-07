import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Banknote, RefreshCw, LayoutGrid, CalendarDays } from "lucide-react";
import { getFinanceSummary } from "../api";
import { usePermissions } from "../hooks/usePermissions";
import { useAuthStore } from "../stores/authStore";
import { PRESETS, getPresetRange, SessionsModal } from "./FinancePage";
import Loading from "../components/Loading";
import PageHeader from "../components/PageHeader";
import styles from "./HomePage.module.scss";

const fmt = (n) => new Intl.NumberFormat("ru-RU").format(Math.round(n ?? 0));

const INTL_LOCALES = { en: "en-US", ru: "ru-RU", uzLatn: "ru-RU", uzCyrl: "ru-RU" };

const fmtDayShort = (iso) => `${iso.slice(8, 10)}.${iso.slice(5, 7)}`;

const fmtDay = (iso, lang) => {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(INTL_LOCALES[lang] ?? "ru-RU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    weekday: "short",
  }).format(d);
};

const HomePage = () => {
  const { t, i18n } = useTranslation();
  const currentPath = window.location.pathname;
  const { canDelete, canEdit } = usePermissions(currentPath);
  const canViewOpenParkings = useAuthStore(
    (s) => !!s.access?.can_view_open_parkings,
  );
  const currency = t("currencySymbol");

  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState([]);
  const [dailyStats, setDailyStats] = useState([]);
  const [preset, setPreset] = useState("today");
  const [range, setRange] = useState(getPresetRange("today"));
  const [view, setView] = useState("locations");
  const [modalParking, setModalParking] = useState(null);
  const [modalRange, setModalRange] = useState(null);

  const fetchData = useCallback(async (r) => {
    if (!r.from || !r.to) return;
    setLoading(true);
    try {
      const result = await getFinanceSummary({ from: r.from, to: r.to });
      setLocations(result?.locations ?? []);
      setDailyStats(result?.dailyStats ?? []);
      if (r.from === r.to) setView("locations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(range);
  }, []);

  const handlePreset = (key) => {
    const r = getPresetRange(key);
    setPreset(key);
    setRange(r);
    fetchData(r);
  };

  const handleDateChange = (field, val) => {
    const r = { ...range, [field]: val };
    setRange(r);
    setPreset(null);
  };

  const handleApply = () => fetchData(range);

  const totalRevenue = useMemo(
    () => locations.reduce((sum, l) => sum + (l.revenue ?? 0), 0),
    [locations],
  );

  // Разбивка по дням доступна только для периода длиннее одного дня
  const hasDays = range.from !== range.to && dailyStats.length > 0;
  const activeView = hasDays ? view : "locations";

  const locationsById = useMemo(
    () => Object.fromEntries(locations.map((l) => [l.id, l])),
    [locations],
  );

  const openParking = (loc, r) => {
    if (!loc) return;
    setModalParking(loc);
    setModalRange(r ?? range);
  };

  // С доступом открытые парковки видны за любой период,
  // без доступа — только закрытые (выезд)
  const closedOnly = !canViewOpenParkings;

  if (loading) return <Loading />;

  return (
    <div className={styles.page}>
      <PageHeader icon={Banknote} title={t("home")} subtitle={t("dashFinancialReport")} color="#6366f1" />

      <div className={styles.controls}>
        <div className={styles.presets}>
          {PRESETS.map((p) => (
            <button
              key={p.key}
              className={`${styles.presetBtn} ${preset === p.key ? styles.presetActive : ""}`}
              onClick={() => handlePreset(p.key)}
            >
              {t(p.label)}
            </button>
          ))}
        </div>
        <div className={styles.datePickers}>
          <input
            type="date"
            className={styles.dateInput}
            value={range.from}
            max={range.to}
            onChange={(e) => handleDateChange("from", e.target.value)}
          />
          <span className={styles.dateSep}>—</span>
          <input
            type="date"
            className={styles.dateInput}
            value={range.to}
            min={range.from}
            onChange={(e) => handleDateChange("to", e.target.value)}
          />
          <button className={styles.applyBtn} onClick={handleApply}>
            {t("apply")}
          </button>
          <button className={styles.dateRefreshBtn} onClick={() => fetchData(range)} title={t("refresh")}>
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {(hasDays || locations.length > 0) && (
        <div className={styles.viewRow}>
          {hasDays && (
            <div className={styles.periodToggle}>
              <button
                className={`${styles.periodBtn} ${activeView === "locations" ? styles.periodBtnActive : ""}`}
                onClick={() => setView("locations")}
              >
                <LayoutGrid size={13} />
                {t("viewByLocations")}
              </button>
              <button
                className={`${styles.periodBtn} ${activeView === "days" ? styles.periodBtnActive : ""}`}
                onClick={() => setView("days")}
              >
                <CalendarDays size={13} />
                {t("viewByDays")}
              </button>
            </div>
          )}
          {locations.length > 0 && (
            <div className={styles.totalBar}>
              <span className={styles.totalLabel}>{t("totalRevenue")}</span>
              <span className={styles.totalValue}>
                {fmt(totalRevenue)} {currency}
              </span>
              <span className={styles.totalDot} />
              <span className={styles.totalMeta}>
                {activeView === "days"
                  ? `${dailyStats.length} ${t("days").toLowerCase()}`
                  : `${locations.length} ${t("locations").toLowerCase()}`}
              </span>
            </div>
          )}
        </div>
      )}

      {activeView === "days" ? (
        <div className={styles.weekGrid}>
          {dailyStats.map((d) => (
            <div key={d.date} className={styles.dayCell}>
              <div className={styles.dayCellHead}>
                <span className={styles.dayCellDate} title={fmtDay(d.date, i18n.language)}>
                  {fmtDayShort(d.date)}
                </span>
                <span className={styles.dayCellCount} title={t("financeParkings")}>
                  {fmt(d.parkings)}
                </span>
              </div>
              <div className={styles.dayCellRevenue}>
                {fmt(d.revenue)} <span className={styles.dayCellCur}>{currency}</span>
              </div>
              <div className={styles.dayCellRows}>
                {(d.locations ?? []).length > 0 ? (
                  d.locations.map((l) => (
                    <button
                      key={l.id}
                      className={styles.dayCellRow}
                      title={`${l.name} — ${fmt(l.revenue)} ${currency} · ${fmt(l.parkings)}`}
                      onClick={() =>
                        openParking(locationsById[l.id], { from: d.date, to: d.date })
                      }
                    >
                      <span className={styles.dayCellRowName}>{l.name}</span>
                      <span className={styles.dayCellRowVal}>{fmt(l.revenue)}</span>
                    </button>
                  ))
                ) : (
                  <div className={styles.dayEmpty}>—</div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : locations.length === 0 ? (
        <div className={styles.empty}>
          <span className={styles.emptyDot} />
          {t("noData")}
        </div>
      ) : (
        <div className={styles.mockGrid}>
          {locations.map((loc) => (
            <div
              key={loc.id}
              className={styles.card}
              style={{ cursor: "pointer" }}
              onClick={() => openParking(loc)}
            >
              <div className={styles.cardHeader}>
                <div className={styles.cardTitleRow}>
                  <h3 className={styles.cardTitle}>{loc.name}</h3>
                  {loc.camerasOnline !== null && (
                    <span
                      className={`${styles.onlineDot} ${loc.camerasOnline ? styles.onlineDotOnline : styles.onlineDotOffline}`}
                      title={loc.camerasOnline ? t("online") : t("offline")}
                    />
                  )}
                </div>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.statContent} style={{ marginBottom: 12 }}>
                  <span className={styles.statLabel}>{t("dashRevenue")}</span>
                  <span className={styles.statValue} style={{ color: "#6366f1" }}>
                    {fmt(loc.revenue)} {currency}
                  </span>
                </div>
                <div className={styles.occHeader}>
                  <span className={styles.occLabel}>{t("dashTariff")}</span>
                  <span className={styles.occSpots}>
                    <b>{loc.tariff ? `${fmt(loc.tariff.base_price)} ${currency}` : "—"}</b>
                  </span>
                </div>
                <div className={styles.occHeader} style={{ marginTop: 6 }}>
                  <span className={styles.occLabel}>{t("dashParkings")}</span>
                  <span className={styles.occSpots}>
                    <b>{loc.parkings}</b>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalParking && (
        <SessionsModal
          parking={modalParking}
          range={modalRange ?? range}
          currency={currency}
          onClose={() => {
            setModalParking(null);
            setModalRange(null);
          }}
          canDelete={canDelete}
          canEdit={canEdit}
          closedOnly={closedOnly}
        />
      )}
    </div>
  );
};

export default HomePage;
