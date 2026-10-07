import { useState, useEffect, useCallback, useMemo } from "react";
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
  ParkingCircle,
  Car,
  TrendingUp,
  Gauge,
  CalendarCheck,
  Banknote,
  BarChart2,
  Activity,
  MapPin,
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import {
  getDashboardSummary,
  getDashboardAnalytics,
  getDashboardFeeds,
  getDashboardParkingsByLocation,
  getFinanceSummary,
  getDashboardOccupancyByLocation,
  getDashboardLocationCoordinates,
} from "../api";
import Loading from "../components/Loading";
import styles from "./HomePage.module.scss";

const parkingMarkerIcon = L.divIcon({
  className: "",
  html: `<div style="width:28px;height:28px;background:#3b82f6;border:2.5px solid #fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 8px rgba(59,130,246,0.45)"><div style="transform:rotate(45deg);display:flex;align-items:center;justify-content:center;width:100%;height:100%;color:#fff;font-size:12px;font-weight:700">P</div></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -30],
});

const fmt = (n) => new Intl.NumberFormat("ru-RU").format(Math.round(n ?? 0));

const fmtPlate = (plate) => {
  if (!plate) return "—";
  const s = plate.toUpperCase().replace(/\s+/g, "");
  const priv = s.match(/^(\d{2})([A-Z])(\d{3})([A-Z]{2})$/);
  if (priv) return `${priv[1]} ${priv[2]} ${priv[3]} ${priv[4]}`;
  const corp = s.match(/^(\d{2})(\d{3})([A-Z]{3})$/);
  if (corp) return `${corp[1]} ${corp[2]} ${corp[3]}`;
  return plate;
};

const fmtTime = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const plateInitials = (plate) => {
  if (!plate) return "?";
  return plate.replace(/\s/g, "").slice(0, 2).toUpperCase();
};

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className={styles.tooltip}>
      <div className={styles.tooltipLabel}>{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className={styles.tooltipRow}>
          <span className={styles.tooltipDot} style={{ background: p.color }} />
          <span>{p.name}</span>
          <strong>{p.value}</strong>
        </div>
      ))}
    </div>
  );
};

const RevenueTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className={styles.tooltip}>
      <div className={styles.tooltipLabel}>{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className={styles.tooltipRow}>
          <span className={styles.tooltipDot} style={{ background: p.color }} />
          <span>{p.name}</span>
          <strong>{fmt(p.value)} UZS</strong>
        </div>
      ))}
    </div>
  );
};

const PERIODS = [
  { key: "today", labelKey: "dashPeriodToday" },
  { key: "yesterday", labelKey: "dashPeriodYesterday" },
  { key: "week", labelKey: "dashPeriodWeek" },
  { key: "month", labelKey: "dashPeriodMonth" },
  { key: "lastMonth", labelKey: "dashPeriodLastMonth" },
];

function getPresetRange(key) {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const fmtD = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  if (key === "today") { const s = fmtD(now); return { from: s, to: s }; }
  if (key === "yesterday") { const d = new Date(now); d.setDate(d.getDate() - 1); const s = fmtD(d); return { from: s, to: s }; }
  if (key === "week") { const day = now.getDay(); const diff = day === 0 ? 6 : day - 1; const d = new Date(now); d.setDate(d.getDate() - diff); return { from: fmtD(d), to: fmtD(now) }; }
  if (key === "month") { return { from: fmtD(new Date(now.getFullYear(), now.getMonth(), 1)), to: fmtD(now) }; }
  if (key === "lastMonth") { return { from: fmtD(new Date(now.getFullYear(), now.getMonth() - 1, 1)), to: fmtD(new Date(now.getFullYear(), now.getMonth(), 0)) }; }
  return { from: fmtD(now), to: fmtD(now) };
}

const PeriodToggle = ({ value, onChange }) => {
  const { t } = useTranslation();
  return (
    <div className={styles.periodToggle}>
      {PERIODS.map((p) => (
        <button
          key={p.key}
          className={`${styles.periodBtn} ${value === p.key ? styles.periodBtnActive : ""}`}
          onClick={() => onChange(p.key)}
        >
          {t(p.labelKey)}
        </button>
      ))}
    </div>
  );
};

const HomePageFull = () => {
  const { t } = useTranslation();
  const [summary, setSummary] = useState(null);
  const [analytics, setAnalytics] = useState([]);
  const [sessionsByParking, setSessionsByParking] = useState([]);
  const [financialReport, setFinancialReport] = useState(null);
  const [occupancyByParking, setOccupancyByParking] = useState([]);
  const [feeds, setFeeds] = useState([]);
  const [parkingLocations, setParkingLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sessionPeriod, setSessionPeriod] = useState("today");
  const [finPeriod, setFinPeriod] = useState("today");
  const [sessionLoading, setSessionLoading] = useState(false);
  const [finLoading, setFinLoading] = useState(false);

  const loadAll = useCallback(async () => {
    try {
      const [s, a, sp, fr, occ, f, pl] = await Promise.allSettled([
        getDashboardSummary(),
        getDashboardAnalytics({ period: sessionPeriod }),
        getDashboardParkingsByLocation({ period: sessionPeriod }),
        getFinanceSummary(getPresetRange(finPeriod)),
        getDashboardOccupancyByLocation(),
        getDashboardFeeds(),
        getDashboardLocationCoordinates(),
      ]);
      if (s.status === "fulfilled") setSummary(s.value);
      if (a.status === "fulfilled") setAnalytics(a.value ?? []);
      if (sp.status === "fulfilled") setSessionsByParking(sp.value ?? []);
      if (fr.status === "fulfilled") setFinancialReport(fr.value);
      if (occ.status === "fulfilled") setOccupancyByParking(occ.value ?? []);
      if (f.status === "fulfilled") setFeeds(f.value ?? []);
      if (pl.status === "fulfilled") setParkingLocations(pl.value ?? []);
    } finally {
      setLoading(false);
    }
  }, [sessionPeriod, finPeriod]);

  useEffect(() => {
    loadAll();
  }, []);

  const handleSessionPeriod = useCallback(async (p) => {
    setSessionPeriod(p);
    setSessionLoading(true);
    try {
      const [a, sp] = await Promise.all([
        getDashboardAnalytics({ period: p }),
        getDashboardParkingsByLocation({ period: p }),
      ]);
      setAnalytics(a ?? []);
      setSessionsByParking(sp ?? []);
    } finally {
      setSessionLoading(false);
    }
  }, []);

  const handleFinPeriod = useCallback(async (p) => {
    setFinPeriod(p);
    setFinLoading(true);
    try {
      const fr = await getFinanceSummary(getPresetRange(p));
      setFinancialReport(fr);
    } finally {
      setFinLoading(false);
    }
  }, []);

  const mapCenter = useMemo(() => {
    if (parkingLocations.length === 0) return [41.2995, 69.2401];
    const lat = parkingLocations.reduce((s, p) => s + p.latitude, 0) / parkingLocations.length;
    const lng = parkingLocations.reduce((s, p) => s + p.longitude, 0) / parkingLocations.length;
    return [lat, lng];
  }, [parkingLocations]);

  if (loading) return <Loading />;

  const statCards = [
    { color: "#3b82f6", icon: ParkingCircle, label: t("dashTotalLocations"), value: summary?.totalLocations ?? "—" },
    { color: "#3b82f6", icon: Car, label: t("dashTotalSpots"), value: summary?.totalSpots ?? "—" },
    { color: "#f59e0b", icon: TrendingUp, label: t("dashOpenParkings"), value: summary?.openParkings ?? "—" },
    { color: "#ef4444", icon: Gauge, label: t("dashOccupancy"), value: `${summary?.occupancyPct ?? 0}%` },
    { color: "#10b981", icon: CalendarCheck, label: t("dashTodayParkings"), value: summary?.todayParkings ?? "—" },
    { color: "#6366f1", icon: Banknote, label: t("dashTodayRevenue"), value: `${fmt(summary?.todayRevenue)} UZS` },
  ];

  const maxSessions = Math.max(...sessionsByParking.map((p) => p.parkings), 1);
  const maxOccupancy = Math.max(...occupancyByParking.map((p) => p.occupancyPct), 1);
  const finLocations = financialReport?.locations ?? [];
  const finDailyStats = financialReport?.dailyStats ?? [];
  const finHourlyStats = financialReport?.hourlyStats ?? [];
  const finDynamics = finHourlyStats.length > 0 ? finHourlyStats : finDailyStats;
  const finTotals = financialReport?.totals ?? {};
  const hasRevChart = finLocations.length > 0;
  const hasDynChart = finDynamics.length > 0;

  return (
    <div className={styles.page}>
      {/* KPI */}
      <div className={styles.statGrid}>
        {statCards.map(({ color, icon: Icon, label, value }) => (
          <div key={label} className={styles.statCard}>
            <div className={styles.statAccent} style={{ background: color }} />
            <div className={styles.statBody}>
              <div className={styles.statIconWrap} style={{ background: color + "18" }}>
                <Icon size={18} color={color} strokeWidth={2} />
              </div>
              <div className={styles.statContent}>
                <span className={styles.statLabel}>{label}</span>
                <span className={styles.statValue} style={{ color }}>{value}</span>
              </div>
            </div>
            <div className={styles.statBg} style={{ background: color }} />
          </div>
        ))}
      </div>

      {/* Sessions card */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.cardTitleRow}>
            <div className={styles.cardIconWrap} style={{ background: "#3b82f618" }}>
              <BarChart2 size={14} color="#3b82f6" />
            </div>
            <h3 className={styles.cardTitle}>{t("dashParkings")}</h3>
          </div>
          <div className={styles.cardHeaderExtra}>
            <PeriodToggle value={sessionPeriod} onChange={handleSessionPeriod} />
          </div>
        </div>
        <div className={styles.cardBody}>
          {sessionLoading ? (
            <div className={styles.empty}><span className={styles.emptyDot} /></div>
          ) : (
            <div className={styles.chartsRow}>
              <div className={styles.chartCard}>
                <div className={styles.chartTitle}>{t("dashParkingsByLocation")}</div>
                {sessionsByParking.length === 0 ? (
                  <div className={styles.empty}><span className={styles.emptyDot} />{t("noData")}</div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={sessionsByParking} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--text-secondary)" }} tickLine={false} />
                      <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="parkings" name={t("dashParkings")} fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={48} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div className={styles.chartCard}>
                <div className={styles.chartTitle}>{t("dashParkingsChart")}</div>
                {analytics.length === 0 ? (
                  <div className={styles.empty}><span className={styles.emptyDot} />{t("noData")}</div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={analytics} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                      <XAxis dataKey="label" tick={{ fontSize: 10, fill: "var(--text-secondary)" }} tickLine={false} tickFormatter={(v) => v.length > 5 ? v.slice(5) : v} interval="preserveStartEnd" />
                      <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                      <Tooltip content={<ChartTooltip />} />
                      <Line type="monotone" dataKey="parkings" name={t("dashParkings")} stroke="#10b981" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Revenue charts */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.cardTitleRow}>
            <div className={styles.cardIconWrap} style={{ background: "#6366f118" }}>
              <TrendingUp size={14} color="#6366f1" />
            </div>
            <h3 className={styles.cardTitle}>{t("dashFinancialReport")}</h3>
          </div>
          <div className={styles.cardHeaderExtra}>
            <PeriodToggle value={finPeriod} onChange={handleFinPeriod} />
          </div>
        </div>
        <div className={styles.cardBody}>
          {finLoading ? (
            <div className={styles.empty}><span className={styles.emptyDot} /></div>
          ) : !financialReport || finLocations.length === 0 ? (
            <div className={styles.empty}><span className={styles.emptyDot} />{t("noData")}</div>
          ) : (
            <>
              {(hasRevChart || hasDynChart) && (
                <div className={styles.chartsRow} style={{ marginBottom: 16 }}>
                  {hasRevChart && (
                    <div className={styles.chartCard}>
                      <div className={styles.chartTitle}>{t("revenueByLocation")}</div>
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={finLocations} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                          <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--text-secondary)" }} tickLine={false} />
                          <YAxis tick={{ fontSize: 11, fill: "var(--text-secondary)" }} tickLine={false} axisLine={false} tickFormatter={(v) => fmt(v)} width={72} />
                          <Tooltip content={<RevenueTooltip />} />
                          <Bar dataKey="revenue" name={t("dashRevenue")} fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={48} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                  {hasDynChart && (
                    <div className={styles.chartCard}>
                      <div className={styles.chartTitle}>{t("dailyChart")}</div>
                      <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={finDynamics} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                          <XAxis dataKey={finHourlyStats.length > 0 ? "label" : "date"} tick={{ fontSize: 10, fill: "var(--text-secondary)" }} tickLine={false} tickFormatter={(v) => v && v.length > 5 ? v.slice(5) : v} interval="preserveStartEnd" />
                          <YAxis tick={{ fontSize: 11, fill: "var(--text-secondary)" }} tickLine={false} axisLine={false} tickFormatter={(v) => fmt(v)} width={72} />
                          <Tooltip content={<RevenueTooltip />} />
                          <Line type="monotone" dataKey="revenue" name={t("dashRevenue")} stroke="#6366f1" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              )}
              <div className={styles.tableContainer}>
                <table className={styles.finTable}>
                  <thead>
                    <tr>
                      <th>{t("dashLocation")}</th>
                      <th>{t("dashTariff")}</th>
                      <th>{t("dashParkings")}</th>
                      <th>{t("dashRevenue")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {finLocations.map((p) => (
                      <tr key={p.id}>
                        <td><b>{p.name}</b></td>
                        <td>{p.tariff?.base_price != null ? `${fmt(p.tariff.base_price)} UZS` : "—"}</td>
                        <td>{p.parkings}</td>
                        <td className={styles.revenueCell}>{fmt(p.revenue)} UZS</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={2}><b>{t("dashTotal")}</b></td>
                      <td><b>{finTotals.totalParkings}</b></td>
                      <td className={styles.revenueCell}><b>{fmt(finTotals.totalRevenue)} UZS</b></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Occupancy by parking + Activity feed */}
      <div className={styles.row2Eq}>
        <div className={`${styles.card} ${styles.cardEq}`}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitleRow}>
              <div className={styles.cardIconWrap} style={{ background: "#ef444418" }}>
                <Gauge size={14} color="#ef4444" />
              </div>
              <h3 className={styles.cardTitle}>{t("dashOccupancyByLocation")}</h3>
            </div>
          </div>
          <div className={styles.cardBody}>
            {occupancyByParking.length === 0 ? (
              <div className={styles.empty}><span className={styles.emptyDot} />{t("noData")}</div>
            ) : (
              <div className={styles.occList}>
                {occupancyByParking.map((p) => {
                  const barColor = p.occupancyPct >= 80 ? "#ef4444" : p.occupancyPct >= 50 ? "#f59e0b" : "#10b981";
                  return (
                    <div key={p.name} className={styles.occRow}>
                      <div className={styles.occHeader}>
                        <span className={styles.occLabel}>{p.name}</span>
                        <span className={styles.occSpots}><b>{p.openParkings}</b> / {p.totalSpots}</span>
                      </div>
                      <div className={styles.occBarRow}>
                        <div className={styles.hbarTrack}>
                          <div
                            className={styles.hbarFill}
                            style={{
                              width: `${(p.occupancyPct / maxOccupancy) * 100}%`,
                              background: barColor,
                            }}
                          />
                        </div>
                        <span className={styles.hbarCount} style={{ color: barColor }}>{p.occupancyPct}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className={`${styles.card} ${styles.cardEq}`}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitleRow}>
              <div className={styles.cardIconWrap} style={{ background: "#f59e0b18" }}>
                <Activity size={14} color="#f59e0b" />
              </div>
              <h3 className={styles.cardTitle}>{t("dashRecentFeed")}</h3>
            </div>
          </div>
          <div className={styles.cardBody}>
            {feeds.length === 0 ? (
              <div className={styles.empty}><span className={styles.emptyDot} />{t("noData")}</div>
            ) : (
              <div className={styles.feedList}>
                {feeds.map((f) => (
                  <div key={f.id} className={styles.feedItem}>
                    <div className={`${styles.feedAvatar} ${styles.feedAvatarCar}`}>
                      {f.photo ? (
                        <img src={`/api/vehicle-passes/image/${f.photo}`} alt={fmtPlate(f.plate_number)} loading="lazy" />
                      ) : (
                        <span className={styles.feedInitials}>{plateInitials(f.plate_number)}</span>
                      )}
                    </div>
                    <div className={styles.feedInfo}>
                      <span className={styles.feedName}>{fmtPlate(f.plate_number)}</span>
                      <span className={styles.feedSub}>{f.location?.name ?? "—"}</span>
                    </div>
                    <div className={styles.feedRight}>
                      <span className={f.direction === "entry" ? styles.badgeEntry : styles.badgeExit}>
                        {t(f.direction === "entry" ? "dashEntry" : "dashExit")}
                      </span>
                      <span className={styles.feedDateTime}>{fmtTime(f.date)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Parking locations map */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.cardTitleRow}>
            <div className={styles.cardIconWrap} style={{ background: "#10b98118" }}>
              <MapPin size={14} color="#10b981" />
            </div>
            <h3 className={styles.cardTitle}>{t("dashLocationCoordinates")}</h3>
          </div>
        </div>
        <div className={styles.cardBody} style={{ padding: 0 }}>
          {parkingLocations.length === 0 ? (
            <div className={styles.empty} style={{ padding: "36px 0" }}>
              <span className={styles.emptyDot} />{t("dashNoLocationCoords")}
            </div>
          ) : (
            <div className={styles.mapWrap}>
              <MapContainer
                center={mapCenter}
                zoom={13}
                style={{ width: "100%", height: "100%" }}
                scrollWheelZoom={false}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />
                {parkingLocations.map((p) => (
                  <Marker
                    key={p.id}
                    position={[p.latitude, p.longitude]}
                    icon={parkingMarkerIcon}
                  >
                    <Popup>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{p.name}</div>
                      {p.total_spots != null && (
                        <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>
                          {p.total_spots} мест
                        </div>
                      )}
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePageFull;
