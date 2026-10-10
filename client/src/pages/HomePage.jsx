import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Banknote,
  RefreshCw,
  LayoutGrid,
  CalendarDays,
  Tag,
  Car,
  ChevronDown,
  Check,
} from "lucide-react";
import { getFinanceSummary } from "../api";
import { PRESETS, getPresetRange } from "./FinancePage";
import Loading from "../components/Loading";
import ParkingHeroBg from "../components/ParkingHeroBg";
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

// День, месяц и день недели отдельно: для карточек «по дням»
const fmtDayParts = (iso, lang) => {
  const d = new Date(`${iso}T00:00:00`);
  const loc = INTL_LOCALES[lang] ?? "ru-RU";
  return {
    day: iso.slice(8, 10),
    month: new Intl.DateTimeFormat(loc, { month: "short" }).format(d),
    weekday: new Intl.DateTimeFormat(loc, { weekday: "long" }).format(d),
    weekend: d.getDay() === 0 || d.getDay() === 6,
  };
};

// Выбор вида отображения: по локациям / по дням (выпадающий список)
const ViewSelect = ({ value, onChange, options }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const current = options.find((o) => o.key === value) ?? options[0];
  const CurrentIcon = current.icon;

  return (
    <div className={styles.viewSelect} ref={ref}>
      <button
        type="button"
        className={`${styles.viewTrigger} ${open ? styles.viewTriggerOpen : ""}`}
        onClick={() => setOpen((v) => !v)}
      >
        <CurrentIcon size={15} className={styles.viewIcon} />
        <span>{current.label}</span>
        <ChevronDown size={14} className={styles.viewChevron} />
      </button>
      {open && (
        <ul className={styles.viewMenu}>
          {options.map(({ key, label, icon: Icon }) => (
            <li key={key}>
              <button
                type="button"
                className={`${styles.viewOption} ${key === value ? styles.viewOptionActive : ""}`}
                onClick={() => {
                  onChange(key);
                  setOpen(false);
                }}
              >
                <Icon size={15} />
                <span>{label}</span>
                {key === value && <Check size={14} className={styles.viewCheck} />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const HomePage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const currency = t("currencySymbol");

  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState([]);
  const [dailyStats, setDailyStats] = useState([]);
  const initialRange = useMemo(() => {
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    return from && to ? { from, to } : null;
  }, []);
  const [preset, setPreset] = useState(initialRange ? null : "today");
  const [range, setRange] = useState(initialRange ?? getPresetRange("today"));
  const [view, setView] = useState("locations");

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

  const maxDayRevenue = useMemo(
    () => dailyStats.reduce((m, d) => Math.max(m, d.revenue ?? 0), 0),
    [dailyStats],
  );

  const locationsById = useMemo(
    () => Object.fromEntries(locations.map((l) => [l.id, l])),
    [locations],
  );

  const openParking = (loc, r) => {
    if (!loc) return;
    const { from, to } = r ?? range;
    // Локацию передаём в состоянии роутера: странице не нужен отдельный запрос summary
    navigate(`/home/location/${loc.id}?from=${from}&to=${to}`, {
      state: { parking: loc },
    });
  };

  if (loading) return <Loading />;

  return (
    <div className={styles.page}>
      <div className={styles.stickyHead}>
      <div className={styles.hero}>
        <ParkingHeroBg className={styles.heroBg} />
        <div className={styles.heroIcon}>
          <Banknote size={22} strokeWidth={2} />
        </div>
        <div className={styles.heroText}>
          <div className={styles.heroCrumb}>{t("home")}</div>
          <h1 className={styles.heroTitle}>{t("dashFinancialReport")}</h1>
        </div>
        {locations.length > 0 && (
          <div className={styles.heroTotal}>
            <span className={styles.heroTotalLabel}>
              {t("totalRevenue")}
            </span>
            <span className={styles.heroTotalValue}>
              {fmt(totalRevenue)} <small>{currency}</small>
            </span>
          </div>
        )}
      </div>

      <div className={styles.controls}>
        {hasDays && (
          <ViewSelect
            value={activeView}
            onChange={setView}
            options={[
              { key: "locations", label: t("viewByLocations"), icon: LayoutGrid },
              { key: "days", label: t("viewByDays"), icon: CalendarDays },
            ]}
          />
        )}
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
      </div>

      {activeView === "days" ? (
        <div className={styles.dayGrid}>
          {dailyStats.map((d) => {
            const parts = fmtDayParts(d.date, i18n.language);
            const share = maxDayRevenue > 0 ? (d.revenue / maxDayRevenue) * 100 : 0;
            const rows = [...(d.locations ?? [])].sort(
              (a, b) => (b.revenue ?? 0) - (a.revenue ?? 0),
            );
            return (
              <div
                key={d.date}
                className={`${styles.dayCard} ${parts.weekend ? styles.dayCardWeekend : ""}`}
              >
                <div className={styles.dayHead}>
                  <div className={styles.dayDate} title={fmtDay(d.date, i18n.language)}>
                    <span className={styles.dayNum}>{parts.day}</span>
                    <span className={styles.dayMeta}>
                      <b>{parts.month}</b>
                      <span>{parts.weekday}</span>
                    </span>
                  </div>
                  <span className={styles.dayCount} title={t("financeParkings")}>
                    <Car size={13} />
                    {fmt(d.parkings)}
                  </span>
                </div>

                <div className={styles.dayRevenue}>
                  {fmt(d.revenue)} <small>{currency}</small>
                </div>
                <div className={styles.dayShare}>
                  <span style={{ width: `${share}%` }} />
                </div>

                <div className={styles.dayRows}>
                  {rows.length > 0 ? (
                    rows.map((l) => (
                      <button
                        key={l.id}
                        className={styles.dayRow}
                        title={`${l.name} — ${fmt(l.revenue)} ${currency} · ${fmt(l.parkings)}`}
                        onClick={() =>
                          openParking(locationsById[l.id], { from: d.date, to: d.date })
                        }
                      >
                        <span
                          className={styles.dayRowBar}
                          style={{
                            width: `${d.revenue > 0 ? ((l.revenue ?? 0) / d.revenue) * 100 : 0}%`,
                          }}
                        />
                        <span className={styles.dayRowName}>{l.name}</span>
                        <span className={styles.dayRowVal}>{fmt(l.revenue)}</span>
                      </button>
                    ))
                  ) : (
                    <div className={styles.dayEmpty}>—</div>
                  )}
                </div>
              </div>
            );
          })}
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
              className={styles.locCard}
              onClick={() => openParking(loc)}
            >
              <div className={styles.locHead}>
                <h3 className={styles.locName} title={loc.name}>
                  {loc.name}
                </h3>
                {loc.camerasOnline !== null && (
                  <span
                    className={`${styles.locStatus} ${loc.camerasOnline ? styles.locStatusOn : styles.locStatusOff}`}
                    title={loc.camerasOnline ? t("online") : t("offline")}
                  >
                    <span className={styles.locStatusDot} />
                  </span>
                )}
              </div>

              <div className={styles.locBig}>
                <span className={styles.locBigLabel}>{t("dashRevenue")}</span>
                <span className={styles.locBigValue}>
                  {fmt(loc.revenue)} <small>{currency}</small>
                </span>
              </div>

              <div className={styles.locStats}>
                <div className={styles.locStat}>
                  <Tag size={15} className={styles.locStatIcon} />
                  <div>
                    <span className={styles.locStatLabel}>{t("dashTariff")}</span>
                    <span className={styles.locStatVal}>
                      {loc.tariff ? `${fmt(loc.tariff.base_price)} ${currency}` : "—"}
                    </span>
                  </div>
                </div>
                <div className={styles.locStat}>
                  <Car size={15} className={styles.locStatIcon} />
                  <div>
                    <span className={styles.locStatLabel}>{t("dashParkings")}</span>
                    <span className={styles.locStatVal}>{fmt(loc.parkings)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default HomePage;
