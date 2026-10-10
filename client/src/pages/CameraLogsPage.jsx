import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { usePermissions } from "../hooks/usePermissions";
import { getCameraLogs, getCameraLogsStats, getCamerasList, getActiveLocations } from "../api";
import Loading from "../components/Loading";
import Pagination from "../components/Pagination";
import PageHero from "../components/PageHero";
import { BarChart3, Camera, Filter, FilterX, RefreshCw, Search, X } from "lucide-react";
import UzPlate from "../components/UzPlate";
import Dropdown from "../components/Dropdown";
import styles from "./CameraLogsPage.module.scss";

const PLATE_CONSENSUS = ["agree", "camera", "ai", "known", "conflict", "ai_no_plate", "ai_unavailable"];
const DIRECTION_CONSENSUS = ["agree", "camera", "ai", "none"];

const CameraLogsPage = () => {
  const { t } = useTranslation();
  const moveLabel = (dir) =>
    dir === "forward" ? t("aiMoveForward") : dir === "reverse" ? t("aiMoveReverse") : t("dirUnknown");
  const currentPath = window.location.pathname;
  usePermissions(currentPath);

  const [lightboxSrc, setLightboxSrc] = useState(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalItems, setTotalItems] = useState(0);
  const [cameras, setCameras] = useState([]);
  const [locations, setLocations] = useState([]);
  const [filters, setFilters] = useState({
    search: "",
    was_processed: "",
    camera_id: "",
    location_id: "",
    date_from: "",
    date_to: "",
    plate_consensus: "",
    direction_consensus: "",
  });
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef(null);
  const filterBtnRef = useRef(null);
  const [stats, setStats] = useState(null);
  const [statsOpen, setStatsOpen] = useState(() => {
    try {
      return localStorage.getItem("cameraLogsStatsOpen") !== "0";
    } catch {
      return true;
    }
  });

  const toggleStats = () =>
    setStatsOpen((v) => {
      try {
        localStorage.setItem("cameraLogsStatsOpen", v ? "0" : "1");
      } catch {
        /* ignore */
      }
      return !v;
    });

  const fetchData = useCallback(
    async (page = 1, f = filters, size = pageSize) => {
      setLoading(true);
      getCameraLogsStats({ filters: JSON.stringify(f) })
        .then(setStats)
        .catch((err) => console.error("cameraLogs stats error:", err));
      try {
        const result = await getCameraLogs({
          page,
          pageSize: size,
          filters: JSON.stringify(f),
        });
        setData(result.data ?? []);
        setCurrentPage(result.pagination?.currentPage ?? 1);
        setTotalPages(result.pagination?.totalPages ?? 1);
        setTotalItems(result.pagination?.totalItems ?? 0);
      } catch (err) {
        console.error("cameraLogs fetch error:", err);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    fetchData(currentPage, filters, pageSize);
  }, [currentPage, pageSize]);

  useEffect(() => {
    getCamerasList().then(setCameras).catch(console.error);
    getActiveLocations().then((r) => setLocations(r.data ?? [])).catch(console.error);
  }, []);

  useEffect(() => {
    if (!lightboxSrc) return;
    const handler = (e) => { if (e.key === "Escape") setLightboxSrc(null); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightboxSrc]);

  useEffect(() => {
    if (!filterOpen) return;
    const onDown = (e) => {
      const el = e.target;
      if (filterRef.current?.contains(el) || filterBtnRef.current?.contains(el)) return;
      setFilterOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setFilterOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [filterOpen]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchData(1, filters, pageSize);
  };

  const handleReset = () => {
    const empty = {
      search: "",
      was_processed: "",
      camera_id: "",
      location_id: "",
      date_from: "",
      date_to: "",
      plate_consensus: "",
      direction_consensus: "",
    };
    setFilters(empty);
    setCurrentPage(1);
    fetchData(1, empty, pageSize);
  };

  // Клик по строке статистики: включить фильтр, повторный клик — снять
  const applyFilter = (key, value) => {
    const next = { ...filters, [key]: filters[key] === value ? "" : value };
    setFilters(next);
    setCurrentPage(1);
    fetchData(1, next, pageSize);
  };

  const activeFilters = [
    filters.location_id,
    filters.camera_id,
    filters.was_processed,
    filters.plate_consensus,
    filters.direction_consensus,
    filters.date_from,
    filters.date_to,
  ].filter(Boolean).length;

  const pct = (n, total) => (total ? `${Math.round((n / total) * 100)}%` : "—");

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const handleChangePageSize = (e) => {
    const size = parseInt(e.target.value, 10);
    setPageSize(size);
    setCurrentPage(1);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleString("ru-RU", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div className={styles.page}>
      {lightboxSrc && (
        <div
          className={styles.lightboxOverlay}
          onClick={() => setLightboxSrc(null)}
        >
          <button
            className={styles.lightboxClose}
            onClick={() => setLightboxSrc(null)}
          >
            <X size={20} />
          </button>
          <img
            className={styles.lightboxImg}
            src={lightboxSrc}
            alt=""
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
      <div className={`${styles.main} settings-page`}>
        <div className={styles.stickyTop}>
        <PageHero
          icon={Camera}
          title={t("camera-logs")}
          center={
            <Pagination
            currentPage={currentPage}
            pageSize={pageSize}
            totalItems={totalItems}
            totalPages={totalPages}
            handleChangePageSize={handleChangePageSize}
            handlePageChange={handlePageChange}
          />
          }
        >
          <div className={styles.heroSearch}>
            <Search size={15} />
            <input
              type="text"
              placeholder={t("search")}
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <button
            type="button"
            ref={filterBtnRef}
            className={`${styles.heroBtn} ${filterOpen ? styles.heroBtnOn : ""}`}
            onClick={() => setFilterOpen((v) => !v)}
          >
            <Filter size={15} />
            <span>{t("filters")}</span>
            {activeFilters > 0 && <span className={styles.filterCount}>{activeFilters}</span>}
          </button>
          <button
            type="button"
            className={styles.heroIconBtn}
            onClick={handleReset}
            title={t("resetAllFilters")}
            aria-label={t("resetAllFilters")}
          >
            <FilterX size={16} />
          </button>
          <button
            type="button"
            className={styles.heroIconBtn}
            onClick={() => fetchData(currentPage, filters, pageSize)}
            aria-label="refresh"
          >
            <RefreshCw size={16} />
          </button>
          {stats && stats.checked > 0 && (
            <button
              type="button"
              className={`${styles.heroIconBtn} ${statsOpen ? styles.heroBtnOn : ""}`}
              onClick={toggleStats}
              title={t("statsOverview")}
              aria-label={t("statsOverview")}
            >
              <BarChart3 size={16} />
            </button>
          )}
        </PageHero>

        {filterOpen && (
          <div className={styles.filterPopover} ref={filterRef}>
            <div className={styles.filterGrid}>
              <div className={styles.field}>
                <span>{t("location")}</span>
                <Dropdown
                  className={styles.modalDropdown}
                  minWidth={150}
                  value={filters.location_id}
                  options={[
                    { value: "", label: t("allLocations") },
                    ...locations.map((loc) => ({ value: String(loc.id), label: loc.name })),
                  ]}
                  onChange={(location_id) => setFilters((f) => ({ ...f, location_id }))}
                />
              </div>
              <div className={styles.field}>
                <span>{t("cameraLogCamera")}</span>
                <Dropdown
                  className={styles.modalDropdown}
                  minWidth={150}
                  value={filters.camera_id}
                  options={[
                    { value: "", label: `${t("cameraLogCamera")} — ${t("filterAll")}` },
                    ...cameras.map((cam) => ({ value: String(cam.id), label: cam.name })),
                  ]}
                  onChange={(camera_id) => setFilters((f) => ({ ...f, camera_id }))}
                />
              </div>
              <div className={styles.field}>
                <span>{t("cameraLogStatus")}</span>
                <Dropdown
                  className={styles.modalDropdown}
                  minWidth={150}
                  value={filters.was_processed}
                  options={[
                    { value: "", label: t("filterAll") },
                    { value: "true", label: t("cameraLogProcessed") },
                    { value: "false", label: t("cameraLogSkipped") },
                  ]}
                  onChange={(was_processed) => setFilters((f) => ({ ...f, was_processed }))}
                />
              </div>
              <div className={styles.field}>
                <span>{t("cameraLogDirection")}</span>
                <Dropdown
                  className={styles.modalDropdown}
                  minWidth={150}
                  value={filters.direction_consensus}
                  options={[
                    { value: "", label: t("filterAll") },
                    ...DIRECTION_CONSENSUS.map((v) => ({ value: v, label: t(`dirConsensus_${v}`) })),
                  ]}
                  onChange={(direction_consensus) =>
                    setFilters((f) => ({ ...f, direction_consensus }))
                  }
                />
              </div>
              <div className={`${styles.field} ${styles.fieldWide}`}>
                <span>{`${t("cameraLogAi")}: ${t("cameraLogPlate")}`}</span>
                <Dropdown
                  className={styles.modalDropdown}
                  minWidth={150}
                  value={filters.plate_consensus}
                  options={[
                    { value: "", label: t("filterAll") },
                    ...PLATE_CONSENSUS.map((v) => ({ value: v, label: t(`aiConsensus_${v}`) })),
                  ]}
                  onChange={(plate_consensus) => setFilters((f) => ({ ...f, plate_consensus }))}
                />
              </div>
              <div className={styles.field}>
                <span>{t("dateFrom")}</span>
                <input
                  type="date"
                  value={filters.date_from}
                  onChange={(e) => setFilters((f) => ({ ...f, date_from: e.target.value }))}
                />
              </div>
              <div className={styles.field}>
                <span>{t("dateTo")}</span>
                <input
                  type="date"
                  value={filters.date_to}
                  onChange={(e) => setFilters((f) => ({ ...f, date_to: e.target.value }))}
                />
              </div>
            </div>
            <div className={styles.filterModalFoot}>
              <button
                type="button"
                className={styles.filterModalReset}
                onClick={() => {
                  setFilterOpen(false);
                  handleReset();
                }}
              >
                {t("resetAllFilters")}
              </button>
              <button
                type="button"
                className={styles.filterModalApply}
                onClick={() => {
                  setFilterOpen(false);
                  handleSearch();
                }}
              >
                {t("search")}
              </button>
            </div>
          </div>
        )}

        </div>

        {loading ? (
          <Loading />
        ) : (
          <>
          {stats && stats.checked > 0 && statsOpen && (
            <div className={styles.statsPanel}>
              <div className={styles.statsRow}>
                <span className={styles.statsLabel}>{t("statsOverview")}</span>
                <div className={styles.chips}>
                  <span className={styles.chip}>
                    {t("cameraLogStatsTotal")} <b>{stats.total}</b>
                  </span>
                  <span className={styles.chip}>
                    {t("statsChecked")}{" "}
                    <b>
                      {stats.checked} ({pct(stats.checked, stats.total)})
                    </b>
                  </span>
                  <span className={styles.chip}>
                    {t("statsAvgCamera")}{" "}
                    <b>{stats.confidence.camera != null ? `${stats.confidence.camera}%` : "—"}</b>
                  </span>
                  <span className={styles.chip}>
                    {t("statsAvgAi")}{" "}
                    <b>{stats.confidence.ai != null ? `${stats.confidence.ai}%` : "—"}</b>
                  </span>
                  <span
                    className={`${styles.chip} ${
                      stats.confidence.delta == null
                        ? ""
                        : stats.confidence.delta >= 0
                          ? styles.deltaUp
                          : styles.deltaDown
                    }`}
                  >
                    {t("statsDelta")}{" "}
                    <b>
                      {stats.confidence.delta != null
                        ? `${stats.confidence.delta > 0 ? "+" : ""}${stats.confidence.delta}%`
                        : "—"}
                    </b>
                  </span>
                </div>
              </div>

              <div className={styles.statsRow}>
                <span className={styles.statsLabel}>{t("statsPlate")}</span>
                <div className={styles.chips}>
                  {PLATE_CONSENSUS.filter((v) => stats.plate[v]).map((v) => (
                    <button
                      key={v}
                      type="button"
                      className={`${styles.chip} ${styles.chipLink} ${
                        filters.plate_consensus === v ? styles.statsActive : ""
                      }`}
                      onClick={() => applyFilter("plate_consensus", v)}
                    >
                      {t(`aiConsensus_${v}`)}{" "}
                      <b>
                        {stats.plate[v]} ({pct(stats.plate[v], stats.checked)})
                      </b>
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.statsRow}>
                <span className={styles.statsLabel}>{t("statsDirection")}</span>
                <div className={styles.chips}>
                  {DIRECTION_CONSENSUS.filter((v) => stats.direction[v]).map((v) => (
                    <button
                      key={v}
                      type="button"
                      className={`${styles.chip} ${styles.chipLink} ${
                        filters.direction_consensus === v ? styles.statsActive : ""
                      }`}
                      onClick={() => applyFilter("direction_consensus", v)}
                    >
                      {t(`dirConsensus_${v}`)}{" "}
                      <b>
                        {stats.direction[v]} ({pct(stats.direction[v], stats.checked)})
                      </b>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>№</th>
                  <th>{t("photo")}</th>
                  <th>{t("cameraLogPlate")}</th>
                  <th>{t("cameraLogConfidence")}</th>
                  <th>{t("cameraLogAi")}</th>
                  <th>{t("cameraLogDirection")}</th>
                  <th>{t("cameraLogCamera")}</th>
                  <th>{t("cameraLogMac")}</th>
                  <th>{t("cameraLogStatus")}</th>
                  <th>{t("cameraLogSkipReason")}</th>
                  <th>{t("cameraLogEventDate")}</th>
                  <th>{t("time")}</th>
                </tr>
              </thead>
              <tbody>
                {data.length > 0 ? (
                  data.map((row, i) => (
                    <tr key={row.id}>
                      <td>{(currentPage - 1) * pageSize + i + 1}</td>
                      <td className={styles.photoCell}>
                        {row.photo ? (
                          <img
                            src={`/api/camera-logs/image/${row.photo}`}
                            alt={row.license_plate}
                            className={styles.photoThumb}
                            onClick={() =>
                              setLightboxSrc(`/api/camera-logs/image/${row.photo}`)
                            }
                          />
                        ) : (
                          <span className={styles.noPhoto}>—</span>
                        )}
                      </td>
                      <td className={styles.plate}>
                        <UzPlate plate={row.license_plate} size="sm" />
                      </td>
                      <td>
                        <span
                          className={`${styles.confidenceBadge} ${
                            row.confidence_level >= 50
                              ? styles.confHigh
                              : styles.confLow
                          }`}
                        >
                          {row.confidence_level}%
                        </span>
                      </td>
                      <td>
                        {row.plate_consensus ? (
                          <div className={styles.aiCell}>
                            {row.ai_plate && (
                              <span
                                className={`${styles.aiPlate} ${
                                  row.ai_plate === row.license_plate ? styles.aiMatch : styles.aiDiff
                                }`}
                              >
                                {row.ai_plate === row.license_plate ? "✓ " : "✗ "}
                                {row.ai_plate}
                                {row.ai_confidence != null && <small> {row.ai_confidence}%</small>}
                              </span>
                            )}
                            {row.ai_confidence != null && (
                              <span
                                className={`${styles.aiMeta} ${
                                  row.ai_confidence - row.confidence_level >= 0 ? styles.deltaUp : styles.deltaDown
                                }`}
                                title={t("confDeltaHint")}
                              >
                                Δ {row.ai_confidence - row.confidence_level > 0 ? "+" : ""}
                                {row.ai_confidence - row.confidence_level}%
                              </span>
                            )}
                            <span className={styles.aiMeta}>
                              {t(`aiConsensus_${row.plate_consensus}`)}
                            </span>
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td>
                        <div className={styles.dirCell}>
                          <span className={styles.dirRow}>
                            <small>{t("dirCamera")}</small>
                            {moveLabel(row.movement_direction)}
                          </span>
                          <span className={styles.dirRow}>
                            <small>{t("dirAi")}</small>
                            {row.plate_consensus ? moveLabel(row.ai_direction) : "—"}
                          </span>
                          <span className={styles.dirRow}>
                            <small>{t("dirVerdict")}</small>
                            {row.direction_consensus ? (
                              <b className={`${styles.dirVerdict} ${styles[`dir_${row.direction_consensus}`] ?? ""}`}>
                                {t(`dirConsensus_${row.direction_consensus}`)}
                              </b>
                            ) : (
                              "—"
                            )}
                          </span>
                        </div>
                      </td>
                      <td>{row.camera_name ?? "—"}</td>
                      <td className={styles.mac}>{row.mac_address}</td>
                      <td>
                        <span
                          className={`${styles.statusBadge} ${
                            row.was_processed
                              ? styles.processed
                              : styles.skipped
                          }`}
                        >
                          {row.was_processed
                            ? t("cameraLogProcessed")
                            : t("cameraLogSkipped")}
                        </span>
                      </td>
                      <td>
                        {row.skip_reason
                          ? t(`cameraLogReason_${row.skip_reason}`)
                          : "—"}
                      </td>
                      <td>{formatDate(row.event_date)}</td>
                      <td>{formatDate(row.created_at)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="12">{t("noData")}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          </>
        )}
      </div>
    </div>
  );
};

export default CameraLogsPage;
