import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

import { usePermissions } from "../hooks/usePermissions";
import { anprCamerasApi, getActiveLocations } from "../api/index";

import AddAnprCamera from "../components/AddAnprCamera";
import EditAnprCamera from "../components/EditAnprCamera";
import Button from "../components/Button";
import Badge from "../components/Badge";
import Pagination from "../components/Pagination";
import Loading from "../components/Loading";
import SortArrow from "../components/SortArrow";
import SelectWithSearch from "../components/SelectWithSearch";
import CenterModal from "../components/CenterModal";
import OverlaySidebar from "../components/OverlaySidebar";
import DownloadButton from "../components/DownloadButton";
import TableIcons from "../icons/tableIcons";

import Search from "../components/Search";
import styles from "./AnprCamerasPage.module.scss";
import { ActionCell } from "../components/ActionButtons";
import PageHeader from "../components/PageHeader";
import { Camera, CheckCircle, XCircle } from "lucide-react";
import { Icons } from "../icons/icons";

const StatWidget = ({ icon: Icon, color, label, value, sub, progress }) => (
  <div className={styles.statWidget}>
    <div className={styles.statWidgetInner}>
      <div
        className={styles.statWidgetIcon}
        style={{ background: color + "18" }}
      >
        <Icon size={15} color={color} strokeWidth={2} />
      </div>
      <div className={styles.statWidgetContent}>
        <span className={styles.statWidgetLabel}>{label}</span>
        <span className={styles.statWidgetValue} style={{ color }}>
          {value}
          {sub && <span className={styles.statWidgetSub}> {sub}</span>}
        </span>
      </div>
    </div>
    {progress != null && (
      <div className={styles.statWidgetProgressTrack}>
        <div
          className={styles.statWidgetProgressFill}
          style={{
            width: `${Math.min(100, Math.max(0, progress))}%`,
            background: color,
          }}
        />
      </div>
    )}
  </div>
);

const AnprCamerasPage = () => {
  const [data, setData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalItems, setTotalItems] = useState(1);
  const [loading, setLoading] = useState(false);
  const [sortField, setSortField] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const { t } = useTranslation();
  const currentPath = window.location.pathname;
  const { canAdd, canEdit, canDelete } = usePermissions(currentPath);
  const [modalType, setModalType] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const [locations, setLocations] = useState([]);

  const [formData, setFormData] = useState({
    location_id: "",
    direction: "",
    search: "",
    status: "",
  });

  useEffect(() => {
    const loadLocations = async () => {
      const result = await getActiveLocations();
      if (result.success) setLocations(result.data);
    };
    loadLocations();
  }, []);


  const handleEditClick = (id) => {
    setSelectedItem(id);
    setModalType("edit");
  };

  const handleDeleteClick = (id) => {
    setSelectedItem(id);
    setShowModal(true);
  };

  const handleDelete = async (itemId) => {
    try {
      await anprCamerasApi.delete(itemId);
      showAlert(t("success"), "success");
      setShowModal(false);
      fetchData();
    } catch (err) {
      console.error("Ошибка при удалении:", err);
      showAlert(t("error"), "error");
    }
  };

  const fetchData = async (
    page = currentPage,
    filters = formData,
    size = pageSize,
  ) => {
    setLoading(true);
    try {
      const { data, pagination } = await anprCamerasApi.get({
        page,
        pageSize: size,
        filters,
      });

      setData(data);
      setTotalPages(pagination.totalPages);
      setCurrentPage(pagination.currentPage);
      setTotalItems(pagination.totalItems);
    } catch (error) {
      console.error("Ошибка при получении данных:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(currentPage);
  }, [currentPage, pageSize]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleChangePageSize = (e) => {
    const size = parseInt(e.target.value, 10);
    setPageSize(size);
    setCurrentPage((prevPage) =>
      Math.min(prevPage, Math.ceil(totalItems / size)),
    );
  };

  const getSortedData = () => {
    return [...data].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      // Пустые значения идут в конец
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      // Если поле — IP
      if (sortField === "camera_ip") {
        const parseIP = (ip) =>
          ip.split(".").map((octet) => parseInt(octet, 10) || 0);

        const aParts = parseIP(aVal);
        const bParts = parseIP(bVal);

        for (let i = 0; i < 4; i++) {
          if (aParts[i] !== bParts[i]) {
            return sortOrder === "asc"
              ? aParts[i] - bParts[i]
              : bParts[i] - aParts[i];
          }
        }
        return 0;
      }

      // Преобразование к числу, если возможно
      const aNum = parseFloat(aVal);
      const bNum = parseFloat(bVal);

      const isNumberA = !isNaN(aNum);
      const isNumberB = !isNaN(bNum);

      if (isNumberA && isNumberB) {
        return sortOrder === "asc" ? aNum - bNum : bNum - aNum;
      }

      // Сравнение как строки
      return sortOrder === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const setLocationAndSearch = (updater) => {
    const updated = typeof updater === "function" ? updater(formData) : updater;
    setFormData(updated);
    fetchData(1, updated, pageSize);
    setCurrentPage(1);
  };

  const handleSearch = (data = formData) => {
    setCurrentPage(1);
    fetchData(1, data, pageSize);
  };

  return (
    <div className={styles.anprCamerasPage}>
      {loading ? (
        <Loading />
      ) : (
        <div className={styles.main}>
          <PageHeader icon={Camera} title={t("vehicle-cameras")} subtitle={t("pageSubtitleAnprCameras")} color="#6366f1" />
          <div className={styles.statsGrid}>
              <StatWidget
                icon={Camera}
                color="#6366f1"
                label={t("totalCamerasLabel")}
                value={totalItems}
              />
              <StatWidget
                icon={CheckCircle}
                color="#10b981"
                label={t("activeCount")}
                value={data.filter((x) => x.status === "active").length}
                sub={`/ ${data.length}`}
              />
              <StatWidget
                icon={XCircle}
                color="#ef4444"
                label={t("inactiveCount")}
                value={data.filter((x) => x.status !== "active").length}
              />
            </div>
          <div className={styles.mainHeader}>
            <div className={styles.filterWrapper}>
              <Search formData={formData} setFormData={setFormData} onSearch={handleSearch} />

              <div className={styles.locationSelect}>
                <SelectWithSearch
                  value={formData.location_id}
                  options={locations}
                  data="location"
                  placeholder={t("selectLocations")}
                  setFormData={setLocationAndSearch}
                  noMatches={t("noMatches")}
                />
              </div>

              <div className={styles.statusFilter}>
                {[
                  { value: "", label: t("all") },
                  { value: "entry", label: t("entry") },
                  { value: "exit", label: t("exit") },
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    className={`${styles.statusBtn} ${formData.direction === value ? styles.statusBtnActive : ""}`}
                    onClick={() => {
                      const updated = { ...formData, direction: value };
                      setFormData(updated);
                      handleSearch(updated);
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className={styles.statusFilter}>
                {[
                  { value: "", label: t("all") },
                  { value: "active", label: t("enabled") },
                  { value: "inactive", label: t("disabled") },
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    className={`${styles.statusBtn} ${formData.status === value ? (value === "inactive" ? styles.statusBtnActiveDanger : value === "active" ? styles.statusBtnActiveSuccess : styles.statusBtnActive) : ""}`}
                    onClick={() => {
                      const updated = { ...formData, status: value };
                      setFormData(updated);
                      handleSearch(updated);
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <Pagination
              currentPage={currentPage}
              pageSize={pageSize}
              totalItems={totalItems}
              totalPages={totalPages}
              handleChangePageSize={handleChangePageSize}
              handlePageChange={handlePageChange}
            />

            <div className={styles.buttonsWrapper}>
              {canAdd && (
                <Button text={t("add")} onClick={() => setModalType("add")} />
              )}

              <div className={styles.refreshBtn} onClick={() => fetchData()}>
                {Icons.refresh}
              </div>

              {data.length > 0 && (
                <DownloadButton
                  text={t("save")}
                  // onClick={() => exportEmployeesToExcel(data)}
                />
              )}
            </div>
          </div>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>№</th>
                  <th onClick={() => handleSort("name")}>
                    <span className={styles.headerContent}>
                      {t("name")}
                      <SortArrow
                        active={sortField === "name"}
                        order={sortOrder}
                      />
                    </span>
                  </th>
                  <th onClick={() => handleSort("id")}>
                    <span className={styles.headerContent}>
                      ID
                      <SortArrow
                        active={sortField === "id"}
                        order={sortOrder}
                      />
                    </span>
                  </th>
                  <th onClick={() => handleSort("camera_ip")}>
                    <span className={styles.headerContent}>
                      {t("ipAddress")}
                      <SortArrow
                        active={sortField === "camera_ip"}
                        order={sortOrder}
                      />
                    </span>
                  </th>
                  <th onClick={() => handleSort("mac_address")}>
                    <span className={styles.headerContent}>
                      {t("macAddress")}
                      <SortArrow
                        active={sortField === "mac_address"}
                        order={sortOrder}
                      />
                    </span>
                  </th>
                  <th onClick={() => handleSort("port")}>
                    <span className={styles.headerContent}>
                      {t("port")}
                      <SortArrow
                        active={sortField === "port"}
                        order={sortOrder}
                      />
                    </span>
                  </th>
                  <th onClick={() => handleSort("gate_name")}>
                    <span className={styles.headerContent}>
                      {t("location")}
                      <SortArrow
                        active={sortField === "gate_name"}
                        order={sortOrder}
                      />
                    </span>
                  </th>
                  <th onClick={() => handleSort("direction")}>
                    <span className={styles.headerContent}>
                      {t("direction")}
                      <SortArrow
                        active={sortField === "direction"}
                        order={sortOrder}
                      />
                    </span>
                  </th>
                  <th onClick={() => handleSort("is_local")}>
                    <span className={styles.headerContent}>
                      {t("localDevice")}
                      <SortArrow
                        active={sortField === "is_local"}
                        order={sortOrder}
                      />
                    </span>
                  </th>
                  <th onClick={() => handleSort("is_online")}>
                    <span className={styles.headerContent}>
                      {t("online")}
                      <SortArrow
                        active={sortField === "is_online"}
                        order={sortOrder}
                      />
                    </span>
                  </th>
                  <th onClick={() => handleSort("status")}>
                    <span className={styles.headerContent}>
                      {t("status")}
                      <SortArrow
                        active={sortField === "status"}
                        order={sortOrder}
                      />
                    </span>
                  </th>
                  {(canEdit || canDelete) && <th>{t("action")}</th>}
                </tr>
              </thead>
              <tbody>
                {data?.length > 0 ? (
                  getSortedData().map((item, i) => (
                    <tr key={item.id}>
                      <td>{i + 1}</td>
                      <td>{item.name}</td>
                      <td>{item.id}</td>
                      <td>{item.camera_ip}</td>
                      <td>{item.mac_address || "—"}</td>
                      <td>{item.port}</td>
                      <td>{item.parking_name}</td>
                      <td>{t(item.direction)}</td>
                      <td>{item.is_local === false ? t("no") : t("yes")}</td>
                      <td>
                        <span
                          className={`${styles.onlineDot} ${item.is_online === false ? styles.onlineDotOffline : styles.onlineDotOnline}`}
                          title={item.is_online === false ? t("offline") : t("online")}
                        />
                      </td>
                      <td>
                        <Badge text={item.status} />
                      </td>
                      {
                        <ActionCell
                          item={item}
                          canEdit={canEdit}
                          canDelete={canDelete}
                          onEdit={handleEditClick}
                          onDelete={handleDeleteClick}
                        />
                      }
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
        </div>
      )}

      <CenterModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onAccept={() => handleDelete(selectedItem)}
        title={t("areYouSureDelete")}
      />
      <OverlaySidebar
        isOpen={modalType !== null}
        onClose={() => setModalType(null)}
        width="500px"
      >
        {modalType === "add" && (
          <AddAnprCamera
            handleClose={() => setModalType(null)}
            onSuccess={() => {
              fetchData();
            }}
          />
        )}
        {modalType === "edit" && (
          <EditAnprCamera
            id={selectedItem}
            handleClose={() => setModalType(null)}
            onSuccess={() => {
              fetchData();
            }}
          />
        )}
      </OverlaySidebar>
    </div>
  );
};

export default AnprCamerasPage;
