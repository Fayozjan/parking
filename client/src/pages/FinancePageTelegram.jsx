import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import {
  TrendingUp,
  Car,
  ParkingCircle,
  BarChart2,
  X,
  Search,
  RefreshCw,
} from "lucide-react";

import {
  getFinanceSummary,
  getFinanceLocationParkings,
  closeFinanceParking,
  cancelFinanceParking,
} from "../api";
import { deleteVehiclePass } from "../api/vehiclePasses";
import { usePermissions } from "../hooks/usePermissions";
import { useScreenStack } from "../context/ScreenStackContext";
import { usePullToRefresh } from "../hooks/usePullToRefresh";
import Loading from "../components/Loading";
import styles from "./FinancePageTelegram.module.scss";

const fmt = (n) => new Intl.NumberFormat("ru-RU").format(Math.round(n));

export const PRESETS = [
  { key: "today", label: "financeToday" },
  { key: "yesterday", label: "financeYesterday" },
  { key: "week", label: "financeLast7" },
  { key: "month", label: "financeThisMonth" },
  { key: "lastMonth", label: "financeLastMonth" },
];

export function getPresetRange(key) {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const f = (d) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  if (key === "today") {
    const s = f(now);
    return { from: s, to: s };
  }
  if (key === "yesterday") {
    const d = new Date(now);
    d.setDate(d.getDate() - 1);
    const s = f(d);
    return { from: s, to: s };
  }
  if (key === "week") {
    const day = now.getDay();
    const diffToMonday = day === 0 ? 6 : day - 1;
    const d = new Date(now);
    d.setDate(d.getDate() - diffToMonday);
    return { from: f(d), to: f(now) };
  }
  if (key === "month") {
    const d = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from: f(d), to: f(now) };
  }
  if (key === "lastMonth") {
    const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const last = new Date(now.getFullYear(), now.getMonth(), 0);
    return { from: f(first), to: f(last) };
  }
  return { from: f(now), to: f(now) };
}

const fmtPlate = (plate) => {
  if (!plate) return "—";
  const s = plate.toUpperCase().replace(/\s+/g, "");
  const priv = s.match(/^(\d{2})([A-Z])(\d{3})([A-Z]{2})$/);
  if (priv) return `${priv[1]} ${priv[2]} ${priv[3]} ${priv[4]}`;
  const corp = s.match(/^(\d{2})(\d{3})([A-Z]{3})$/);
  if (corp) return `${corp[1]} ${corp[2]} ${corp[3]}`;
  return plate;
};

const fmtDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const fmtDuration = (minutes) => {
  if (minutes == null) return "—";
  if (minutes < 60) return `${minutes} мин`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}ч ${m}мин` : `${h}ч`;
};

const toLocalIso = (d) => {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

// ── Sessions detail screen (pushed via ScreenStack) ──────────────────────────
export const SessionsScreen = ({ parking, range, currency, canDelete }) => {
  const { t } = useTranslation();
  const [sessions, setSessions] = useState([]);
  const [totalClosed, setTotalClosed] = useState(0);
  const [totalOpen, setTotalOpen] = useState(0);
  const [totalRevenueClosed, setTotalRevenueClosed] = useState(0);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [filter, setFilter] = useState("all");
  const [closingEntryId, setClosingEntryId] = useState(null);
  const [closeDateTime, setCloseDateTime] = useState("");
  const [search, setSearch] = useState("");
  const [confirmSession, setConfirmSession] = useState(null);
  const [lightboxSrc, setLightboxSrc] = useState(null);
  const [sortKey, setSortKey] = useState("date");
  const [sortDir, setSortDir] = useState("desc");
  const [showSort, setShowSort] = useState(false);

  const fetchSessions = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const res = await getFinanceLocationParkings({
        locationId: parking.id,
        from: range.from,
        to: range.to,
      });
      setSessions(res.records);
      setTotalClosed(res.totalClosed);
      setTotalOpen(res.totalOpen);
      setTotalRevenueClosed(res.totalRevenueClosed ?? res.totalClosed);
    } catch (e) {
      console.error(e);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [parking.id, range.from, range.to]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleCloseSession = async (plateNumber, dateStr) => {
    setActionLoading(`close-${plateNumber}`);
    try {
      await closeFinanceParking({
        locationId: parking.id,
        plateNumber,
        date: new Date(dateStr).toISOString(),
      });
      setClosingEntryId(null);
      await fetchSessions({ silent: true });
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelSession = async (exitId) => {
    setActionLoading(`cancel-${exitId}`);
    try {
      await cancelFinanceParking({ exitId });
      await fetchSessions({ silent: true });
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteSession = async (session) => {
    const key = `delete-${session.entry_id ?? session.exit_id}`;
    setActionLoading(key);
    try {
      if (session.exit_id) await deleteVehiclePass(session.exit_id);
      if (session.entry_id) await deleteVehiclePass(session.entry_id);
      setConfirmSession(null);
      await fetchSessions({ silent: true });
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  const startClose = (entryId) => {
    setClosingEntryId(entryId);
    setCloseDateTime(toLocalIso(new Date()));
  };

  const searchNorm = search.toUpperCase().replace(/\s+/g, "");
  const filtered = sessions.filter((s) => {
    const filterOk =
      filter === "closed" ? !s.is_open : filter === "open" ? s.is_open : true;
    const searchOk =
      !searchNorm ||
      (s.plate_number ?? "").toUpperCase().replace(/\s+/g, "").includes(searchNorm);
    return filterOk && searchOk;
  });

  const displayed = [...filtered].sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1;
    if (sortKey === "plate") {
      return dir * (a.plate_number ?? "").localeCompare(b.plate_number ?? "");
    }
    if (sortKey === "duration") {
      const da = a.duration_minutes ?? 0;
      const db = b.duration_minutes ?? 0;
      return dir * (da - db);
    }
    if (sortKey === "status") {
      return dir * ((a.is_open ? 1 : 0) - (b.is_open ? 1 : 0));
    }
    return dir * (new Date(a.entry_time || 0) - new Date(b.entry_time || 0));
  });

  const handleFilter = (f) => {
    setFilter(f);
    setClosingEntryId(null);
  };

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const revenue = totalRevenueClosed * (parking.tariff?.base_price ?? 0);

  return (
    <div className={styles.sessionsPage}>
      <div className={styles.sessionsHeader} />
      <div className={styles.sessionsMain}>
      {lightboxSrc && (
        <div className={styles.lightboxOverlay} onClick={() => setLightboxSrc(null)}>
          <button className={styles.lightboxClose} onClick={() => setLightboxSrc(null)}>
            <X size={20} />
          </button>
          <img className={styles.lightboxImg} src={lightboxSrc} alt="" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      {confirmSession && (
        <div className={styles.confirmOverlay} onClick={() => setConfirmSession(null)}>
          <div className={styles.confirmDialog} onClick={(e) => e.stopPropagation()}>
            <div className={styles.confirmIcon}><X size={22} /></div>
            <div className={styles.confirmTitle}>{t("confirmDelete")}</div>
            <div className={styles.confirmPlate}>{fmtPlate(confirmSession.plate_number)}</div>
            <div className={styles.confirmActions}>
              <button className={styles.confirmCancelBtn} onClick={() => setConfirmSession(null)}>
                {t("cancel")}
              </button>
              <button
                className={styles.confirmDeleteBtn}
                disabled={!!actionLoading}
                onClick={() => handleDeleteSession(confirmSession)}
              >
                {t("delete")}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.sessionsMeta}>
        <div className={styles.sessionsMetaLeft}>
          <span className={styles.sessionsMetaTitle}>{parking.name}</span>
          <span className={styles.sessionsMetaRange}>{range.from} — {range.to}</span>
          <span className={styles.sessionsMetaCount}>
            {fmt(totalClosed)} {t("financeParkings").toLowerCase()}
            {parking.tariff && ` · ${fmt(parking.tariff.base_price)} ${currency}`}
            {parking.free_period != null && ` · ${parking.free_period} ${t("min")}`}
          </span>
        </div>
        {parking.tariff && totalClosed > 0 && (
          <span className={styles.sessionsMetaRevenue}>
            {fmt(revenue)} {currency}
          </span>
        )}
      </div>

      <div className={styles.sessionsSticky}>
        <div className={styles.sessionsFilters}>
          {[
            { key: "all", label: t("filterAll"), count: totalClosed + totalOpen },
            { key: "closed", label: t("financeParkings"), count: totalClosed },
            { key: "open", label: t("parkingOpen"), count: totalOpen },
          ].map(({ key, label, count }) => (
            <button
              key={key}
              className={`${styles.sessionsFilterBtn} ${filter === key ? styles.sessionsFilterActive : ""} ${key === "open" && count > 0 ? styles.sessionsFilterOpen : ""}`}
              onClick={() => handleFilter(key)}
            >
              {label} <span className={styles.sessionsFilterCount}>{count}</span>
            </button>
          ))}
        </div>

        <div className={styles.sessionsSearchRow}>
          <div className={styles.sessionsSearchWrap}>
            <Search size={14} className={styles.sessionsSearchIcon} />
            <input
              type="text"
              className={styles.sessionsSearchInput}
              placeholder={t("plateNumber")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            className={`${styles.sortToggleBtn} ${showSort ? styles.sortToggleActive : ""}`}
            onClick={() => setShowSort((v) => !v)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
              <path d="M3 6h18M6 12h12M9 18h6" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {showSort && (
          <div className={styles.sortRow}>
            {[
              { key: "plate", label: t("plateNumber") },
              { key: "duration", label: t("parkingDuration") },
              { key: "date", label: t("date") },
              { key: "status", label: t("status") },
            ].map(({ key, label }) => (
              <button
                key={key}
                className={`${styles.sortBtn} ${sortKey === key ? styles.sortBtnActive : ""}`}
                onClick={() => handleSort(key)}
              >
                {label}
                {sortKey === key && (
                  <span className={styles.sortArrow}>{sortDir === "asc" ? "↑" : "↓"}</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className={styles.sessionsLoading}><Loading /></div>
      ) : (
        <div className={styles.sessionsCardList}>
          {displayed.length === 0 && (
            <div className={styles.empty}>{t("noData")}</div>
          )}
          {displayed.map((s, i) => {
            const liveDuration = s.is_open && s.entry_time
              ? Math.round((Date.now() - new Date(s.entry_time).getTime()) / 60000)
              : s.duration_minutes;
            const freePeriod = parking.free_period;
            const freePeriodExpired = s.is_open && freePeriod != null && liveDuration > freePeriod;
            const hasPhotos = s.entry_photo || s.exit_photo;
            const showPrice = !s.is_open && parking.tariff && !s.is_no_tariff && !s.is_free_period;
            const showOpenPrice = s.is_open && freePeriodExpired && parking.tariff && !s.is_no_tariff;

            return (
              <div key={i} className={`${styles.sessionCard} ${s.is_open ? styles.sessionCardOpen : ""}`}>
                {/* 1. Plate number */}
                <div className={styles.plateRow}>
                  <span className={styles.sessionCardPlate}>{fmtPlate(s.plate_number)}</span>
                  {s.is_open && <span className={styles.openBadge}>{t("parkingOpen")}</span>}
                </div>

                {/* 2. Photos side by side */}
                <div className={styles.photosRow}>
                  <div className={styles.photoBlock}>
                    {s.entry_photo ? (
                      <img
                        className={styles.photoImg}
                        src={`/api/vehicle-passes/image/${s.entry_photo}`}
                        alt=""
                        loading="lazy"
                        onClick={() => setLightboxSrc(`/api/vehicle-passes/image/${s.entry_photo}`)}
                      />
                    ) : (
                      <div className={styles.photoEmpty}>
                        <Car size={24} />
                      </div>
                    )}
                    <span className={styles.photoTime}>{t("entry")}: {fmtDate(s.entry_time)}</span>
                  </div>
                  <div className={styles.photoBlock}>
                    {s.exit_photo ? (
                      <img
                        className={styles.photoImg}
                        src={`/api/vehicle-passes/image/${s.exit_photo}`}
                        alt=""
                        loading="lazy"
                        onClick={() => setLightboxSrc(`/api/vehicle-passes/image/${s.exit_photo}`)}
                      />
                    ) : (
                      <div className={styles.photoEmpty}>
                        {s.is_open ? <span className={styles.photoEmptyOpen}>...</span> : <Car size={24} />}
                      </div>
                    )}
                    <span className={styles.photoTime}>
                      {t("exit")}: {s.is_open ? "—" : fmtDate(s.exit_time)}
                    </span>
                  </div>
                </div>

                {/* 3. Duration + price */}
                <div className={styles.statsRow}>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>{t("parkingDuration")}</span>
                    <span className={styles.statValue}>{fmtDuration(liveDuration)}</span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>{t("financePrice")}</span>
                    <span className={`${styles.statValue} ${styles.statPrice}`}>
                      {(showPrice || showOpenPrice) ? (
                        <>{fmt(parking.tariff.base_price)} {currency}</>
                      ) : "—"}
                    </span>
                  </div>
                </div>

                {/* 4. Actions */}
                <div className={styles.sessionCardActions}>
                  {s.is_open ? (
                    closingEntryId === s.entry_id ? (
                      <div className={styles.inlineCloseForm}>
                        <input
                          type="datetime-local"
                          className={styles.closeDtInput}
                          value={closeDateTime}
                          onChange={(e) => setCloseDateTime(e.target.value)}
                        />
                        <button
                          className={styles.confirmCloseBtn}
                          disabled={!closeDateTime || actionLoading === `close-${s.plate_number}`}
                          onClick={() => handleCloseSession(s.plate_number, closeDateTime)}
                        >
                          ✓
                        </button>
                        <button className={styles.cancelCloseBtn} onClick={() => setClosingEntryId(null)}>
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className={styles.sessionActionBtns}>
                        <button
                          className={`${styles.actionBtn} ${styles.actionBtnClose}`}
                          disabled={!!actionLoading}
                          onClick={() => startClose(s.entry_id)}
                        >
                          {t("closeParking")}
                        </button>
                        {canDelete && (
                          <button
                            className={`${styles.actionBtn} ${styles.actionBtnDelete}`}
                            disabled={!!actionLoading}
                            onClick={() => setConfirmSession(s)}
                          >
                            {t("deleteBtn")}
                          </button>
                        )}
                      </div>
                    )
                  ) : (
                    <div className={styles.sessionActionBtns}>
                      {s.is_manual && (
                        <button
                          className={`${styles.actionBtn} ${styles.actionBtnClose}`}
                          disabled={actionLoading === `cancel-${s.exit_id}`}
                          onClick={() => handleCancelSession(s.exit_id)}
                        >
                          {t("cancelParking")}
                        </button>
                      )}
                      {canDelete && (
                        <button
                          className={`${styles.actionBtn} ${styles.actionBtnDelete}`}
                          disabled={!!actionLoading}
                          onClick={() => setConfirmSession(s)}
                        >
                          {t("deleteBtn")}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

        </div>
      )}
      </div>
    </div>
  );
};

// ── Chart tooltip ─────────────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label, currency }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className={styles.tooltip}>
      <div className={styles.tooltipTitle}>{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className={styles.tooltipRow}>
          <span style={{ color: p.color }}>{p.name}:</span>
          <span>
            {fmt(p.value)} {p.dataKey === "revenue" ? currency : ""}
          </span>
        </div>
      ))}
    </div>
  );
};

// ── Main finance page ────────────────────────────────────────────────────────
const FinancePageTelegram = () => {
  const { t } = useTranslation();
  const currentPath = window.location.pathname.replace(/^\/tg/, "");
  const { canDelete } = usePermissions(currentPath);
  const { pushScreen } = useScreenStack();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [preset, setPreset] = useState("today");
  const [range, setRange] = useState(getPresetRange("today"));
  const scrollRef = useRef(null);

  const currency = t("currencySymbol");

  const fetchData = useCallback(
    async (r = range) => {
      if (!r.from || !r.to) return;
      setLoading(true);
      setError(null);
      try {
        const result = await getFinanceSummary({ from: r.from, to: r.to });
        setData(result);
      } catch (err) {
        console.error(err);
        setError(err?.response?.data?.message || err.message || "Error");
      } finally {
        setLoading(false);
      }
    },
    [range],
  );

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

  const openLocation = (parking) => {
    pushScreen(
      `finance-location-${parking.id}`,
      <SessionsScreen
        parking={parking}
        range={range}
        currency={currency}
        canDelete={canDelete}
      />,
    );
  };

  usePullToRefresh(
    () => fetchData(range),
    scrollRef,
    loading,
  );

  const totals = data?.totals ?? {};
  const locations = data?.locations ?? [];
  const dailyStats = data?.dailyStats ?? [];
  const hourlyStats = data?.hourlyStats ?? [];

  const chartParkings = locations
    .filter((p) => p.revenue > 0 || p.parkings > 0)
    .map((p) => ({ name: p.name, revenue: p.revenue, sessions: p.parkings }));

  const hasChart = chartParkings.length > 0;
  const hasDailyChart = dailyStats.length > 0;
  const hasHourlyChart = hourlyStats.length > 0;

  const kpis = [
    { icon: TrendingUp, color: "#6366f1", label: t("totalRevenue"), value: fmt(totals.totalRevenue ?? 0), sub: currency },
    { icon: Car, color: "#10b981", label: t("financeParkings"), value: fmt(totals.totalParkings ?? 0) },
    { icon: ParkingCircle, color: "#f59e0b", label: t("locations"), value: totals.activeLocations ?? 0 },
    { icon: BarChart2, color: "#8b5cf6", label: t("avgRevenuePerLocation"), value: fmt(totals.avgRevenuePerLocation ?? 0), sub: currency },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header} />
      <div className={styles.main} id="scroll-container" ref={scrollRef}>
        {/* Period presets */}
        <div className={styles.presetScroll}>
          {PRESETS.map((p) => (
            <button
              key={p.key}
              className={`${styles.presetBtn} ${preset === p.key ? styles.presetBtnActive : ""}`}
              onClick={() => handlePreset(p.key)}
            >
              {t(p.label)}
            </button>
          ))}
        </div>

        {/* Date range inputs */}
        <div className={styles.dateRow}>
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
          <button
            className={styles.refreshBtn}
            onClick={() => fetchData(range)}
          >
            <RefreshCw size={15} />
          </button>
        </div>

        {loading ? (
          <div className={styles.loadingWrap}><Loading /></div>
        ) : error ? (
          <div className={styles.errorBox}>{error}</div>
        ) : (
          <>
            {/* KPI cards */}
            <div className={styles.kpiGrid}>
              {kpis.map(({ icon: Icon, color, label, value, sub }) => (
                <div key={label} className={styles.kpiCard}>
                  <div className={styles.kpiIcon} style={{ background: color + "18" }}>
                    <Icon size={20} color={color} strokeWidth={2} />
                  </div>
                  <div className={styles.kpiBody}>
                    <span className={styles.kpiLabel}>{label}</span>
                    <span className={styles.kpiValue} style={{ color }}>
                      {value}
                      {sub && <small className={styles.kpiSub}> {sub}</small>}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Charts */}
            {(hasChart || hasDailyChart || hasHourlyChart) && (
              <div className={styles.chartsSection}>
                {hasChart && (
                  <div className={styles.chartCard}>
                    <div className={styles.chartTitle}>{t("revenueByLocation")}</div>
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart
                        data={chartParkings}
                        margin={{ top: 4, right: 8, left: 0, bottom: 4 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--tg-separator)" />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 10, fill: "var(--text-secondary)" }}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 10, fill: "var(--text-secondary)" }}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(v) => fmt(v)}
                          width={56}
                        />
                        <Tooltip content={<ChartTooltip currency={currency} />} />
                        <Bar
                          dataKey="revenue"
                          name={t("financeRevenue")}
                          fill="#6366f1"
                          radius={[4, 4, 0, 0]}
                          maxBarSize={36}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {hasDailyChart && (
                  <div className={styles.chartCard}>
                    <div className={styles.chartTitle}>{t("dailyChart")}</div>
                    <ResponsiveContainer width="100%" height={180}>
                      <LineChart
                        data={dailyStats}
                        margin={{ top: 4, right: 8, left: 0, bottom: 4 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--tg-separator)" />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 9, fill: "var(--text-secondary)" }}
                          tickLine={false}
                          tickFormatter={(v) => v.slice(5)}
                        />
                        <YAxis
                          tick={{ fontSize: 10, fill: "var(--text-secondary)" }}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(v) => fmt(v)}
                          width={56}
                        />
                        <Tooltip content={<ChartTooltip currency={currency} />} />
                        <Line
                          type="monotone"
                          dataKey="revenue"
                          name={t("financeRevenue")}
                          stroke="#6366f1"
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {hasHourlyChart && (
                  <div className={styles.chartCard}>
                    <div className={styles.chartTitle}>{t("dailyChart")}</div>
                    <ResponsiveContainer width="100%" height={180}>
                      <LineChart
                        data={hourlyStats}
                        margin={{ top: 4, right: 8, left: 0, bottom: 4 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--tg-separator)" />
                        <XAxis
                          dataKey="label"
                          tick={{ fontSize: 8, fill: "var(--text-secondary)" }}
                          tickLine={false}
                          interval={2}
                        />
                        <YAxis
                          tick={{ fontSize: 10, fill: "var(--text-secondary)" }}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(v) => fmt(v)}
                          width={56}
                        />
                        <Tooltip content={<ChartTooltip currency={currency} />} />
                        <Line
                          type="monotone"
                          dataKey="revenue"
                          name={t("financeRevenue")}
                          stroke="#6366f1"
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            )}

            {/* Location list */}
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <ParkingCircle size={15} color="#6366f1" />
                <span className={styles.sectionTitle}>{t("revenueByLocation")}</span>
              </div>

              {locations.length === 0 ? (
                <div className={styles.empty}>{t("noData")}</div>
              ) : (
                <div className={styles.locationList}>
                  {locations.map((loc) => (
                    <div
                      key={loc.id}
                      className={styles.locationCard}
                      onClick={() => openLocation(loc)}
                    >
                      <div className={styles.locationInfo}>
                        <span className={styles.locationName}>{loc.name}</span>
                        <span className={styles.locationMeta}>
                          {fmt(loc.parkings)} {t("financeParkings").toLowerCase()}
                          {loc.tariff && ` · ${fmt(loc.tariff.base_price)} ${currency}`}
                          {loc.free_period != null && ` · ${loc.free_period} ${t("min")}`}
                        </span>
                      </div>
                      <div className={styles.locationRight}>
                        {loc.revenue > 0 ? (
                          <span className={styles.locationRevenue}>
                            {fmt(loc.revenue)} <small>{currency}</small>
                          </span>
                        ) : (
                          <span className={styles.locationNoRevenue}>—</span>
                        )}
                        {loc.avgPerDay > 0 && (
                          <span className={styles.locationAvg}>
                            ~{fmt(loc.avgPerDay)}/{t("financeAvgPerDay").toLowerCase().split("/")[0] || "д"}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        <div className={styles.bottomSpacer} />
      </div>
    </div>
  );
};

export default FinancePageTelegram;
