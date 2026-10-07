import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { usePermissions } from "../hooks/usePermissions";
import { getCameraLogs, getCamerasList, getActiveLocations } from "../api";
import Loading from "../components/Loading";
import Pagination from "../components/Pagination";
import PageHeader from "../components/PageHeader";
import { Icons } from "../icons/icons";
import { Camera, X } from "lucide-react";
import styles from "./CameraLogsPage.module.scss";

const CameraLogsPage = () => {
  const { t } = useTranslation();
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
  });

  const fetchData = useCallback(
    async (page = 1, f = filters, size = pageSize) => {
      setLoading(true);
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

  const handleSearch = () => {
    setCurrentPage(1);
    fetchData(1, filters, pageSize);
  };

  const handleReset = () => {
    const empty = { search: "", was_processed: "", camera_id: "", location_id: "", date_from: "", date_to: "" };
    setFilters(empty);
    setCurrentPage(1);
    fetchData(1, empty, pageSize);
  };

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
      {loading ? (
        <Loading />
      ) : (
        <div className={styles.main}>
          <PageHeader
            icon={Camera}
            title={t("camera-logs")}
            subtitle={t("pageSubtitleCameraLogs")}
            color="#0ea5e9"
          />
          <div className={styles.mainHeader}>
            <div className={styles.filters}>
              <input
                type="text"
                placeholder={t("search")}
                value={filters.search}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, search: e.target.value }))
                }
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />

              <select
                value={filters.location_id}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, location_id: e.target.value }))
                }
              >
                <option value="">{t("allLocations")}</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>

              <select
                value={filters.camera_id}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, camera_id: e.target.value }))
                }
              >
                <option value="">{t("cameraLogCamera")} — {t("filterAll")}</option>
                {cameras.map((cam) => (
                  <option key={cam.id} value={cam.id}>
                    {cam.name}
                  </option>
                ))}
              </select>

              <select
                value={filters.was_processed}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, was_processed: e.target.value }))
                }
              >
                <option value="">{t("cameraLogStatus")} — {t("filterAll")}</option>
                <option value="true">{t("cameraLogProcessed")}</option>
                <option value="false">{t("cameraLogSkipped")}</option>
              </select>

              <input
                type="date"
                value={filters.date_from}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, date_from: e.target.value }))
                }
                className={styles.dateInput}
                title={t("dateFrom")}
              />

              <input
                type="date"
                value={filters.date_to}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, date_to: e.target.value }))
                }
                className={styles.dateInput}
                title={t("dateTo")}
              />

              <button className={styles.searchBtn} onClick={handleSearch}>
                {t("search")}
              </button>
              <button className={styles.resetBtn} onClick={handleReset}>
                {t("resetAllFilters")}
              </button>
            </div>

            <div className={styles.rightActions}>
              <Pagination
                currentPage={currentPage}
                pageSize={pageSize}
                totalItems={totalItems}
                totalPages={totalPages}
                handleChangePageSize={handleChangePageSize}
                handlePageChange={handlePageChange}
              />
              <div
                className={styles.refreshBtn}
                onClick={() => fetchData(currentPage, filters, pageSize)}
              >
                {Icons.refresh}
              </div>
            </div>
          </div>

          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>№</th>
                  <th>{t("photo")}</th>
                  <th>{t("cameraLogPlate")}</th>
                  <th>{t("cameraLogConfidence")}</th>
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
                      <td className={styles.plate}>{row.license_plate}</td>
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
                    <td colSpan="10">{t("noData")}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default CameraLogsPage;
