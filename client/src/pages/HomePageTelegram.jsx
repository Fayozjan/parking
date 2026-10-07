import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { RefreshCw, ChevronRight } from "lucide-react";
import { getFinanceSummary } from "../api";
import { usePermissions } from "../hooks/usePermissions";
import { useScreenStack } from "../context/ScreenStackContext";
import { usePullToRefresh } from "../hooks/usePullToRefresh";
import { PRESETS, getPresetRange, SessionsScreen } from "./FinancePageTelegram";
import Loading from "../components/Loading";
import styles from "./HomePageTelegram.module.scss";
import financeTgStyles from "./FinancePageTelegram.module.scss";

const fmt = (n) => new Intl.NumberFormat("ru-RU").format(Math.round(n ?? 0));

const HomePageTelegram = () => {
  const { t } = useTranslation();
  const currentPath = window.location.pathname.replace(/^\/tg/, "");
  const { canDelete } = usePermissions(currentPath);
  const { pushScreen } = useScreenStack();
  const currency = t("currencySymbol");

  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState([]);
  const [preset, setPreset] = useState("today");
  const [range, setRange] = useState(getPresetRange("today"));
  const scrollRef = useRef(null);

  const fetchData = useCallback(async (r) => {
    if (!r.from || !r.to) return;
    setLoading(true);
    try {
      const result = await getFinanceSummary({ from: r.from, to: r.to });
      setLocations(result?.locations ?? []);
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

  const openLocation = (loc) => {
    pushScreen(
      `home-location-${loc.id}`,
      <SessionsScreen parking={loc} range={range} currency={currency} canDelete={canDelete} />,
    );
  };

  usePullToRefresh(() => fetchData(range), scrollRef, loading);

  if (loading) {
    return (
      <div className={styles.loadingWrap}>
        <Loading />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header} />
      <div className={styles.main} id="scroll-container" ref={scrollRef}>
        {/* Period presets */}
        <div className={financeTgStyles.presetScroll}>
          {PRESETS.map((p) => (
            <button
              key={p.key}
              className={`${financeTgStyles.presetBtn} ${preset === p.key ? financeTgStyles.presetBtnActive : ""}`}
              onClick={() => handlePreset(p.key)}
            >
              {t(p.label)}
            </button>
          ))}
        </div>

        {/* Date range inputs */}
        <div className={financeTgStyles.dateRow}>
          <input
            type="date"
            className={financeTgStyles.dateInput}
            value={range.from}
            max={range.to}
            onChange={(e) => handleDateChange("from", e.target.value)}
          />
          <span className={financeTgStyles.dateSep}>—</span>
          <input
            type="date"
            className={financeTgStyles.dateInput}
            value={range.to}
            min={range.from}
            onChange={(e) => handleDateChange("to", e.target.value)}
          />
          <button className={financeTgStyles.applyBtn} onClick={handleApply}>
            {t("apply")}
          </button>
          <button className={financeTgStyles.refreshBtn} onClick={() => fetchData(range)}>
            <RefreshCw size={15} />
          </button>
        </div>

        {/* Total across all locations */}
        {locations.length > 0 && (
          <div className={styles.totalBar}>
            <div className={styles.totalLeft}>
              <span className={styles.totalLabel}>{t("totalRevenue")}</span>
              <span className={styles.totalMeta}>
                {locations.length} {t("locations").toLowerCase()}
              </span>
            </div>
            <span className={styles.totalValue}>
              {fmt(totalRevenue)} <small>{currency}</small>
            </span>
          </div>
        )}

        {/* Location list */}
        <div className={styles.section}>
          {locations.length === 0 ? (
            <div className={styles.empty}>{t("noData")}</div>
          ) : (
            <div className={financeTgStyles.locationList}>
              {locations.map((loc) => (
                <div
                  key={loc.id}
                  className={financeTgStyles.locationCard}
                  onClick={() => openLocation(loc)}
                >
                  <div className={financeTgStyles.locationInfo}>
                    <span className={financeTgStyles.locationNameRow}>
                      <span className={financeTgStyles.locationName}>{loc.name}</span>
                      {loc.camerasOnline !== null && (
                        <span
                          className={`${styles.onlineDot} ${loc.camerasOnline ? styles.onlineDotOnline : styles.onlineDotOffline}`}
                          title={loc.camerasOnline ? t("online") : t("offline")}
                        />
                      )}
                    </span>
                    <span className={financeTgStyles.locationMeta}>
                      {fmt(loc.parkings)} {t("financeParkings").toLowerCase()}
                      {loc.tariff && ` · ${fmt(loc.tariff.base_price)} ${currency}`}
                    </span>
                  </div>
                  <div className={financeTgStyles.locationRight}>
                    {loc.revenue > 0 ? (
                      <span className={financeTgStyles.locationRevenue}>
                        {fmt(loc.revenue)} <small>{currency}</small>
                      </span>
                    ) : (
                      <span className={financeTgStyles.locationNoRevenue}>—</span>
                    )}
                  </div>
                  <ChevronRight size={16} className={financeTgStyles.locationChevron} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.bottomSpacer} />
      </div>
    </div>
  );
};

export default HomePageTelegram;
