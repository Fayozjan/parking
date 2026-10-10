import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { usePermissions } from "../hooks/usePermissions";
import { getAuditLogs, getAuditEntities, getAuditUsers, restoreAuditLog, restoreAuditLogs, getActiveLocations } from "../api";
import { useAlertStore } from "../stores/alertStore";
import Loading from "../components/Loading";
import Pagination from "../components/Pagination";
import Dropdown from "../components/Dropdown";
import OverlaySidebar from "../components/OverlaySidebar";
import ListHero, {
  FilterField,
  FilterSegment,
  FilterGrid,
  StatsLine,
  heroControlStyles as hc,
} from "../components/ListHero";
import { ClipboardList, RotateCcw } from "lucide-react";
import styles from "./AuditLogsPage.module.scss";

// ISO-дата из снапшота (2026-08-25T18:40:00.000Z) → 25.08.2026, 23:40:00
const ISO_DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;

const formatDateTime = (str) => {
  const d = new Date(str);
  if (Number.isNaN(d.getTime())) return str;
  return d.toLocaleString("ru-RU", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

// Сущности, которые умеет восстанавливать сервер (RESTORABLE_ENTITIES)
const RESTORABLE = ["vehicle_passes", "vehicle_whitelist", "location_tariffs", "location_tariff_history"];
const canRestoreRow = (row) => row.action === "delete" && !!row.old_data && RESTORABLE.includes(row.entity);

const formatValue = (val) => {
  if (val === null || val === undefined) return <span className={styles.nullVal}>—</span>;
  if (typeof val === "boolean") return String(val);
  if (typeof val === "string" && ISO_DATE.test(val)) return formatDateTime(val);
  if (typeof val === "object") return <pre className={styles.inlineJson}>{JSON.stringify(val, null, 2)}</pre>;
  return String(val);
};

// location_id — сырой ID в снапшоте, добавляем читаемое имя парковки следующей строкой
const withLocationName = (data, locationMap) => {
  if (!data || data.location_id === undefined || data.location_id === null) return data;
  const result = {};
  for (const [key, val] of Object.entries(data)) {
    result[key] = val;
    if (key === "location_id" && !("location_name" in data)) {
      result.location_name = locationMap[val] ?? null;
    }
  }
  return result;
};

const DiffTable = ({ oldData: rawOld, newData: rawNew, action, locationMap = {} }) => {
  const oldData = withLocationName(rawOld, locationMap);
  const newData = withLocationName(rawNew, locationMap);

  if (action === "update" && oldData && newData) {
    const norm = (v) => (v === undefined || v === null) ? null : v;
    const allKeys = [...new Set([...Object.keys(oldData), ...Object.keys(newData)])];
    const changedKeys = allKeys.filter(
      (k) => JSON.stringify(norm(oldData[k])) !== JSON.stringify(norm(newData[k])),
    );

    if (changedKeys.length === 0) {
      return <span className={styles.nullVal}>Изменений не обнаружено</span>;
    }

    return (
      <table className={styles.diffTable}>
        <thead>
          <tr>
            <th className={styles.diffFieldCol}>Поле</th>
            <th>Было</th>
            <th>Стало</th>
          </tr>
        </thead>
        <tbody>
          {changedKeys.map((key) => (
            <tr key={key} className={styles.changedRow}>
              <td className={`${styles.fieldName} ${styles.fieldNameChanged}`}>
                <span className={styles.changeDot} />
                {key}
              </td>
              <td className={styles.oldVal}>{formatValue(oldData[key])}</td>
              <td className={styles.newVal}>{formatValue(newData[key])}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  const data = action === "delete" ? oldData : newData;
  if (!data) return <span className={styles.nullVal}>—</span>;

  return (
    <table className={styles.diffTable}>
      <thead>
        <tr>
          <th className={styles.diffFieldCol}>Поле</th>
          <th>Значение</th>
        </tr>
      </thead>
      <tbody>
        {Object.entries(data).map(([key, val]) => (
          <tr key={key}>
            <td className={styles.fieldName}>{key}</td>
            <td>{formatValue(val)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

const AuditLogsPage = () => {
  const { t } = useTranslation();
  const currentPath = window.location.pathname;
  usePermissions(currentPath);
  const { showAlert } = useAlertStore();

  const [data, setData] = useState([]);
  const [restoring, setRestoring] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalItems, setTotalItems] = useState(0);
  const [entities, setEntities] = useState([]);
  const [users, setUsers] = useState([]);
  const [locationMap, setLocationMap] = useState({});
  const [selectedRow, setSelectedRow] = useState(null);
  const [filters, setFilters] = useState({
    entity: "",
    action: "",
    user_id: "",
    date_from: "",
    date_to: "",
  });

  const fetchData = useCallback(
    async (page = 1, f = filters, size = pageSize) => {
      setLoading(true);
      try {
        const result = await getAuditLogs({
          page,
          pageSize: size,
          filters: JSON.stringify(f),
        });
        setData(result.data ?? []);
        setSelectedIds([]);
        setCurrentPage(result.pagination?.currentPage ?? 1);
        setTotalPages(result.pagination?.totalPages ?? 1);
        setTotalItems(result.pagination?.totalItems ?? 0);
      } catch (err) {
        console.error("auditLogs fetch error:", err);
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
    getAuditEntities()
      .then((r) => setEntities(r.data ?? []))
      .catch(console.error);

    getAuditUsers()
      .then((r) => setUsers(r.data ?? []))
      .catch(console.error);

    getActiveLocations()
      .then((r) => {
        const map = {};
        (r.data ?? []).forEach((loc) => {
          map[loc.id] = loc.name;
        });
        setLocationMap(map);
      })
      .catch(console.error);
  }, []);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchData(1, filters, pageSize);
  };

  const handleReset = () => {
    const empty = { entity: "", action: "", user_id: "", date_from: "", date_to: "" };
    setFilters(empty);
    setCurrentPage(1);
    fetchData(1, empty, pageSize);
  };

  const handleRestore = async (row) => {
    if (!window.confirm(t("confirmRestore"))) return;
    setRestoring(true);
    try {
      await restoreAuditLog(row.id);
      showAlert(t("restoreSuccess"), "success");
      setSelectedRow(null);
      fetchData(currentPage, filters, pageSize);
    } catch (err) {
      showAlert(err.response?.data?.error || t("restoreError"), "error");
    } finally {
      setRestoring(false);
    }
  };

  const restorableRows = data.filter(canRestoreRow);
  const allSelected = restorableRows.length > 0 && restorableRows.every((r) => selectedIds.includes(r.id));

  const toggleOne = (id) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const toggleAll = () => setSelectedIds(allSelected ? [] : restorableRows.map((r) => r.id));

  const handleRestoreSelected = async () => {
    if (!selectedIds.length || !window.confirm(`${t("confirmRestore")} (${selectedIds.length})`)) return;
    setRestoring(true);
    try {
      const { data: res } = await restoreAuditLogs(selectedIds);
      const fail = res.failed.length;
      showAlert(
        t("restoreBulkDone", { ok: res.restored, fail }),
        fail > 0 ? "error" : "success",
      );
      fetchData(currentPage, filters, pageSize);
    } catch (err) {
      showAlert(err.response?.data?.error || t("restoreError"), "error");
    } finally {
      setRestoring(false);
    }
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
    });
  };

  const countChanges = (row) => {
    if (row.action !== "update" || !row.old_data || !row.new_data) return null;
    const norm = (v) => (v === undefined || v === null) ? null : v;
    const keys = [...new Set([...Object.keys(row.old_data), ...Object.keys(row.new_data)])];
    const count = keys.filter((k) => JSON.stringify(norm(row.old_data[k])) !== JSON.stringify(norm(row.new_data[k]))).length;
    return count > 0 ? count : null;
  };

  return (
    <div className={styles.page}>
      <div className={`${styles.main} settings-page`}>
        <ListHero
          icon={ClipboardList}
          title={t("auditLogs")}
          pagination={<Pagination
              currentPage={currentPage}
              pageSize={pageSize}
              totalItems={totalItems}
              totalPages={totalPages}
              handleChangePageSize={handleChangePageSize}
              handlePageChange={handlePageChange}
            />}
          filterContent={
            <FilterGrid>
              <FilterField label={t("auditUser")} wide>
                <Dropdown
                  className={hc.fullDropdown}
                  minWidth={150}
                  value={filters.user_id}
                  options={[
                    { value: "", label: t("filterAll") },
                    ...users.map((u) => ({ value: String(u.id), label: u.name })),
                  ]}
                  onChange={(user_id) => setFilters((f) => ({ ...f, user_id }))}
                />
              </FilterField>
              <FilterField label={t("auditEntity")} wide>
                <Dropdown
                  className={hc.fullDropdown}
                  minWidth={150}
                  value={filters.entity}
                  options={[
                    { value: "", label: t("filterAll") },
                    ...entities.map((ent) => ({ value: ent, label: ent })),
                  ]}
                  onChange={(entity) => setFilters((f) => ({ ...f, entity }))}
                />
              </FilterField>
              <FilterField label={t("auditAction")} wide>
                <FilterSegment
                  value={filters.action}
                  options={[
                    { value: "", label: t("filterAll") },
                    { value: "create", label: t("create") },
                    { value: "update", label: t("update") },
                    { value: "delete", label: t("delete") },
                  ]}
                  onChange={(action) => setFilters((f) => ({ ...f, action }))}
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
          activeFilters={Object.values(filters).filter(Boolean).length}
          onApplyFilters={handleSearch}
          onResetFilters={handleReset}
          onRefresh={() => fetchData(currentPage, filters, pageSize)}
        >
          {selectedIds.length > 0 && (
            <button
              type="button"
              className={hc.heroBtn}
              disabled={restoring}
              onClick={handleRestoreSelected}
            >
              <RotateCcw size={15} />
              <span>
                {restoring ? t("restoring") : `${t("restoreSelected")} (${selectedIds.length})`}
              </span>
            </button>
          )}
        </ListHero>

        {loading ? (
          <Loading />
        ) : (
          <>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.checkCol}>
                    {restorableRows.length > 0 && (
                      <input
                        type="checkbox"
                        className={styles.rowCheck}
                        checked={allSelected}
                        onChange={toggleAll}
                        title={t("selectAll")}
                      />
                    )}
                  </th>
                  <th>№</th>
                  <th>{t("auditEntity")}</th>
                  <th>{t("auditAction")}</th>
                  <th>{t("auditRecordId")}</th>
                  <th>{t("auditUser")}</th>
                  <th>{t("time")}</th>
                </tr>
              </thead>
              <tbody>
                {data.length > 0 ? (
                  data.map((row, i) => {
                    const changes = countChanges(row);
                    return (
                      <tr
                        key={row.id}
                        className={styles.clickableRow}
                        onClick={() => setSelectedRow(row)}
                      >
                        <td className={styles.checkCol} onClick={(e) => e.stopPropagation()}>
                          {canRestoreRow(row) && (
                            <input
                              type="checkbox"
                              className={styles.rowCheck}
                              checked={selectedIds.includes(row.id)}
                              onChange={() => toggleOne(row.id)}
                            />
                          )}
                        </td>
                        <td>{(currentPage - 1) * pageSize + i + 1}</td>
                        <td>{row.entity}</td>
                        <td>
                          <span
                            className={`${styles.actionBadge} ${styles[row.action]}`}
                          >
                            {t(row.action)}
                          </span>
                          {changes > 0 && (
                            <span className={styles.changeCount}>{changes}</span>
                          )}
                        </td>
                        <td>{row.record_id ?? "—"}</td>
                        <td>{row.user_name ?? "—"}</td>
                        <td>{formatDate(row.added_at)}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7">{t("noData")}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          </>
        )}
      </div>

      <OverlaySidebar
        isOpen={selectedRow !== null}
        onClose={() => setSelectedRow(null)}
        title={t("auditLogs")}
        width="900px"
      >
        {selectedRow && (
          <div className={styles.diffContainer}>
            <div className={styles.diffMeta}>
              <div className={styles.diffMetaRow}>
                <span className={styles.diffMetaLabel}>{t("auditEntity")}:</span>
                <span>{selectedRow.entity}</span>
              </div>
              <div className={styles.diffMetaRow}>
                <span className={styles.diffMetaLabel}>{t("auditAction")}:</span>
                <span className={`${styles.actionBadge} ${styles[selectedRow.action]}`}>
                  {t(selectedRow.action)}
                </span>
              </div>
              <div className={styles.diffMetaRow}>
                <span className={styles.diffMetaLabel}>{t("auditRecordId")}:</span>
                <span>{selectedRow.record_id ?? "—"}</span>
              </div>
              <div className={styles.diffMetaRow}>
                <span className={styles.diffMetaLabel}>{t("auditUser")}:</span>
                <span>{selectedRow.user_name ?? "—"}</span>
              </div>
              <div className={styles.diffMetaRow}>
                <span className={styles.diffMetaLabel}>{t("time")}:</span>
                <span>{formatDate(selectedRow.added_at)}</span>
              </div>

              {selectedRow.action === "delete" && (
                <button
                  className={styles.restoreBtn}
                  disabled={restoring}
                  onClick={() => handleRestore(selectedRow)}
                >
                  {restoring ? t("restoring") : t("restore")}
                </button>
              )}
            </div>

            <div className={styles.diffBody}>
              <DiffTable
                oldData={selectedRow.old_data}
                newData={selectedRow.new_data}
                action={selectedRow.action}
                locationMap={locationMap}
              />
            </div>
          </div>
        )}
      </OverlaySidebar>
    </div>
  );
};

export default AuditLogsPage;
