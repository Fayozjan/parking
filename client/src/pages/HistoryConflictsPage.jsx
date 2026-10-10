import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { usePermissions } from "../hooks/usePermissions";
import { getVehiclePasses, getActiveLocations } from "../api";
import Loading from "../components/Loading";
import Pagination from "../components/Pagination";
import ListHero, {
  FilterField,
  FilterSegment,
  FilterGrid,
  StatsLine,
  heroControlStyles as hc,
} from "../components/ListHero";
import { History, FilterX, X } from "lucide-react";
import UzPlate from "../components/UzPlate";
import Dropdown from "../components/Dropdown";
import styles from "./HistoryConflictsPage.module.scss";

const EMPTY_FILTERS = {
  search: "",
  location_id: "",
  direction: "",
  date_from: "",
  date_to: "",
};

const getScoreLevel = (score) => {
  if (score >= 85) return "scoreHigh";
  if (score >= 60) return "scoreMedium";
  return "scoreLow";
};

// Фильтры страницы -> фильтры API проездов
const toApiFilters = (f) => ({
  history_conflict: true,
  search: f.search || undefined,
  direction: f.direction || undefined,
  selectedLocationIds: f.location_id ? [f.location_id] : undefined,
  start_date: f.date_from ? `${f.date_from} 00:00` : undefined,
  end_date: f.date_to ? `${f.date_to} 23:59` : undefined,
});

const HistoryConflictsPage = () => {
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
  const [locations, setLocations] = useState([]);
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  const fetchData = useCallback(
    async (page = 1, f = filters, size = pageSize) => {
      setLoading(true);
      try {
        const result = await getVehiclePasses({
          page,
          pageSize: size,
          filters: toApiFilters(f),
        });
        setData(result.data ?? []);
        setCurrentPage(result.pagination?.currentPage ?? 1);
        setTotalPages(result.pagination?.totalPages ?? 1);
        setTotalItems(result.pagination?.totalItems ?? 0);
      } catch (err) {
        console.error("historyConflicts fetch error:", err);
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
    getActiveLocations()
      .then((r) => setLocations(r.data ?? []))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!lightboxSrc) return;
    const handler = (e) => {
      if (e.key === "Escape") setLightboxSrc(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightboxSrc]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchData(1, filters, pageSize);
  };

  const handleReset = () => {
    setFilters(EMPTY_FILTERS);
    setCurrentPage(1);
    fetchData(1, EMPTY_FILTERS, pageSize);
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const handleChangePageSize = (e) => {
    setPageSize(parseInt(e.target.value, 10));
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

  const dirLabel = (d) => (d === "entry" ? t("entry") : d === "exit" ? t("exit") : t("unknown"));

  return (
    <div className={styles.page}>
      {lightboxSrc && (
        <div className={styles.lightboxOverlay} onClick={() => setLightboxSrc(null)}>
          <button className={styles.lightboxClose} onClick={() => setLightboxSrc(null)}>
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
        <ListHero
          icon={History}
          title={t("history-conflicts")}
          pagination={<Pagination
              currentPage={currentPage}
              pageSize={pageSize}
              totalItems={totalItems}
              totalPages={totalPages}
              handleChangePageSize={handleChangePageSize}
              handlePageChange={handlePageChange}
            />}
          searchValue={filters.search}
          onSearchInput={(v) => setFilters((f) => ({ ...f, search: v }))}
          onSearch={() => handleSearch()}
          filterContent={
            <FilterGrid>
              <FilterField label={t("location")} wide>
                <Dropdown
                  className={hc.fullDropdown}
                  minWidth={150}
                  value={filters.location_id}
                  options={[
                    { value: "", label: t("allLocations") },
                    ...locations.map((loc) => ({ value: String(loc.id), label: loc.name })),
                  ]}
                  onChange={(location_id) => setFilters((f) => ({ ...f, location_id }))}
                />
              </FilterField>
              <FilterField label={t("direction")} wide>
                <Dropdown
                  className={hc.fullDropdown}
                  minWidth={150}
                  value={filters.direction}
                  options={[
                    { value: "", label: t("filterAll") },
                    { value: "entry", label: t("entry") },
                    { value: "exit", label: t("exit") },
                  ]}
                  onChange={(direction) => setFilters((f) => ({ ...f, direction }))}
                />
              </FilterField>
              <FilterField label={t("dateFrom")}>
                <input
                  type="date"
                  value={filters.date_from}
                  onChange={(e) => setFilters((f) => ({ ...f, date_from: e.target.value }))}
                />
              </FilterField>
              <FilterField label={t("dateTo")}>
                <input
                  type="date"
                  value={filters.date_to}
                  onChange={(e) => setFilters((f) => ({ ...f, date_to: e.target.value }))}
                />
              </FilterField>
            </FilterGrid>
          }
          activeFilters={[filters.location_id, filters.direction, filters.date_from, filters.date_to].filter(Boolean).length}
          onApplyFilters={handleSearch}
          onResetFilters={handleReset}
          onRefresh={() => fetchData(currentPage, filters, pageSize)}
        >
        </ListHero>

        {loading ? (
          <Loading />
        ) : (
          <>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>№</th>
                  <th>{t("photo")}</th>
                  <th>{t("cameraLogPlate")}</th>
                  <th>{t("historyConflictProblem")}</th>
                  <th>{t("direction")}</th>
                  <th>{t("historyConflictCorrection")}</th>
                  <th>{t("historyConflictLocation")}</th>
                  <th>{t("cameraLogCamera")}</th>
                  <th>{t("historyConflictScore")}</th>
                  <th>{t("cameraLogEventDate")}</th>
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
                            src={`/api/vehicle-passes/image/${row.photo}`}
                            alt={row.plate_number}
                            className={styles.photoThumb}
                            onClick={() => setLightboxSrc(`/api/vehicle-passes/image/${row.photo}`)}
                          />
                        ) : (
                          <span className={styles.noPhoto}>—</span>
                        )}
                      </td>
                      <td className={styles.plate}>
                        <UzPlate plate={row.plate_number} size="sm" />
                      </td>
                      <td>
                        <span className={styles.problemBadge}>
                          {row.direction === "exit"
                            ? t("historyConflictExitNoEntry")
                            : t("historyConflictRepeatEntry")}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`${styles.dirBadge} ${
                            row.direction === "exit" ? styles.exit : styles.entry
                          }`}
                        >
                          {dirLabel(row.direction)}
                        </span>
                      </td>
                      <td>
                        {row.direction_source === "ai" && row.direction_original ? (
                          <span className={styles.correction}>
                            {t("passFlagAiDirectionHint", { from: dirLabel(row.direction_original) })}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td>{row.location_name ?? "—"}</td>
                      <td>{row.camera_name ?? "—"}</td>
                      <td>
                        {row.score != null ? (
                          <span className={`${styles.scoreBadge} ${styles[getScoreLevel(row.score)]}`}>
                            {row.score}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td>{formatDate(row.date)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="10">{t("historyConflictEmpty")}</td>
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

export default HistoryConflictsPage;
