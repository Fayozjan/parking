import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

import { usePermissions } from "../hooks/usePermissions";
import { useAlertStore } from "../stores/alertStore";

import { deleteLocationById, getLocations } from "../api";

import Badge from "../components/Badge";
import AddLocation from "../components/AddLocation";
import EditLocation from "../components/EditLocation";
import Pagination from "../components/Pagination";
import Loading from "../components/Loading";
import SortArrow from "../components/SortArrow";
import OverlaySidebar from "../components/OverlaySidebar";
import CenterModal from "../components/CenterModal";

import { ActionCell } from "../components/ActionButtons";
import ListHero, {
  FilterField,
  FilterSegment,
  FilterGrid,
  StatsLine,
  heroControlStyles as hc,
} from "../components/ListHero";
import { Car, CheckCircle, XCircle, MapPin } from "lucide-react";
import styles from "./LocationsPage.module.scss";

const LocationsPage = () => {
  const [data, setData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalItems, setTotalItems] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [sortField, setSortField] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const { t } = useTranslation();
  const { showAlert } = useAlertStore();

  const [formData, setFormData] = useState({ search: "", status: "" });

  const currentPath = window.location.pathname;
  const { canAdd, canEdit, canDelete } = usePermissions(currentPath);

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
      await deleteLocationById(itemId);
      showAlert(t("success"), "success");
      setShowModal(false);
      fetchData();
    } catch (err) {
      console.error(err);
      showAlert(t("error"), "error");
    }
  };

  const fetchData = async (page = currentPage, filters = formData, size = pageSize) => {
    setLoading(true);
    try {
      const { data, pagination } = await getLocations({ page, pageSize: size, filters });
      setData(data);
      setTotalPages(pagination.totalPages);
      setCurrentPage(pagination.currentPage);
      setTotalItems(pagination.totalItems);
    } catch (error) {
      console.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(currentPage);
  }, [currentPage, pageSize]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const handleChangePageSize = (e) => {
    const size = parseInt(e.target.value, 10);
    setPageSize(size);
    setCurrentPage((prev) => Math.min(prev, Math.ceil(totalItems / size)));
  };

  const getSortedData = () =>
    [...data].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      const aNum = parseFloat(aVal);
      const bNum = parseFloat(bVal);
      if (!isNaN(aNum) && !isNaN(bNum)) return sortOrder === "asc" ? aNum - bNum : bNum - aNum;
      return sortOrder === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });

  const handleSort = (field) => {
    if (sortField === field) setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortOrder("asc"); }
  };

  const handleSearch = (d = formData) => {
    setCurrentPage(1);
    fetchData(1, d, pageSize);
  };

  const activeCount = data.filter((x) => x.status === true).length;
  const inactiveCount = data.filter((x) => x.status !== true).length;

  return (
    <div className={styles.locationsPage}>
      <div className={`${styles.main} settings-page`}>
        <ListHero
          icon={MapPin}
          title={t("locations")}
          pagination={<Pagination
              currentPage={currentPage}
              pageSize={pageSize}
              totalItems={totalItems}
              totalPages={totalPages}
              handleChangePageSize={handleChangePageSize}
              handlePageChange={handlePageChange}
            />}
          searchValue={formData.search}
          onSearchInput={(v) => setFormData((f) => ({ ...f, search: v }))}
          onSearch={() => handleSearch()}
          filterContent={
            <FilterField label={t("status")}>
              <FilterSegment
                value={formData.status}
                options={[
                  { value: "", label: t("all") },
                  { value: "true", label: t("enabled") },
                  { value: "false", label: t("disabled") },
                ]}
                onChange={(status) => setFormData((f) => ({ ...f, status }))}
              />
            </FilterField>
          }
          activeFilters={formData.status ? 1 : 0}
          onApplyFilters={() => handleSearch()}
          onResetFilters={() => {
            const next = { ...formData, status: "" };
            setFormData(next);
            handleSearch(next);
          }}
          onAdd={canAdd ? () => setModalType("add") : undefined}
          onRefresh={() => fetchData()}
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
                  <th onClick={() => handleSort("name")}>
                    <span className={styles.headerContent}>
                      {t("name")}
                      <SortArrow active={sortField === "name"} order={sortOrder} />
                    </span>
                  </th>
                  <th onClick={() => handleSort("status")}>
                    <span className={styles.headerContent}>
                      {t("status")}
                      <SortArrow active={sortField === "status"} order={sortOrder} />
                    </span>
                  </th>
                  <th>{t("totalSpots")}</th>
                  <th>{t("freePeriod")}</th>
                  <th>{t("shiftStart")}</th>
                  <th>{t("shiftEnd")}</th>
                  <th>{t("locationTariff")}</th>
                  {(canEdit || canDelete) && <th>{t("action")}</th>}
                </tr>
              </thead>
              <tbody>
                {data?.length > 0 ? (
                  getSortedData().map((item, i) => (
                    <tr key={item.id}>
                      <td>{(currentPage - 1) * pageSize + i + 1}</td>
                      <td>{item.name}</td>
                      <td>
                        <Badge text={item.status ? "active" : "inactive"} />
                      </td>
                      <td>{item.totalSpots ?? "—"}</td>
                      <td>{item.freePeriod ? `${item.freePeriod} ${t("min")}` : "—"}</td>
                      <td>{item.shiftStart ?? "—"}</td>
                      <td>{item.shiftEnd ?? "—"}</td>
                      <td>{item.tariff?.base_price ?? "—"}</td>
                      <ActionCell
                        item={item}
                        canEdit={canEdit}
                        canDelete={canDelete}
                        onEdit={handleEditClick}
                        onDelete={handleDeleteClick}
                      />
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9">{t("noData")}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          </>
        )}
        <StatsLine
          items={[
            { label: t("locations"), value: totalItems },
            { label: t("activeCount"), value: activeCount, sub: data.length, tone: "ok" },
            { label: t("inactiveCount"), value: inactiveCount, sub: data.length, tone: "bad" },
          ]}
        />
      </div>

      <CenterModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onAccept={() => handleDelete(selectedItem)}
        title={t("areYouSureDelete")}
      />

      <OverlaySidebar
        isOpen={modalType !== null}
        onClose={() => setModalType(null)}
        title={modalType === "add" ? t("addLocation") : t("editLocation")}
        width="600px"
      >
        {modalType === "add" && (
          <AddLocation
            handleClose={() => setModalType(null)}
            onSuccess={() => { setTimeout(() => setModalType(null), 500); fetchData(); }}
          />
        )}
        {modalType === "edit" && (
          <EditLocation
            id={selectedItem}
            handleClose={() => setModalType(null)}
            onSuccess={() => { setTimeout(() => setModalType(null), 500); fetchData(); }}
          />
        )}
      </OverlaySidebar>
    </div>
  );
};

export default LocationsPage;
