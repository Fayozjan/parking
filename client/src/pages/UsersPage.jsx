import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

import { usePermissions } from "../hooks/usePermissions";

import { deleteUserById, getUsers } from "../api";

import Badge from "../components/Badge";
import AddUser from "../components/AddUser";
import EditUser from "../components/EditUser";
import Pagination from "../components/Pagination";
import Loading from "../components/Loading";
import SortArrow from "../components/SortArrow";
import OverlaySidebar from "../components/OverlaySidebar";
import CenterModal from "../components/CenterModal";

import styles from "./UsersPage.module.scss";
import hc from "../styles/heroControls.module.scss";
import { ActionCell } from "../components/ActionButtons";
import PageHero from "../components/PageHero";
import { Users, Filter, Plus, RefreshCw, Download, Search } from "lucide-react";

const accessLevelMap = {
  absolute: "access_absolute",
  branch: "access_branch",
  department: "access_department",
};

const UsersPage = () => {
  const [data, setData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalItems, setTotalItems] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [sortField, setSortField] = useState("username");
  const [sortOrder, setSortOrder] = useState("asc");
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef(null);
  const filterBtnRef = useRef(null);
  const searchTimer = useRef(null);
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    search: "",
    status: "",
  });


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
      await deleteUserById(itemId);
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
      const { data, pagination } = await getUsers({
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
    const size = parseInt(e.target.value, 50);
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

  const handleSearch = (data = formData) => {
    setCurrentPage(1);
    fetchData(1, data, pageSize);
  };

  const onSearchChange = (e) => {
    const next = { ...formData, search: e.target.value };
    setFormData(next);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => handleSearch(next), 1000);
  };

  const onSearchKey = (e) => {
    if (e.key !== "Enter") return;
    clearTimeout(searchTimer.current);
    handleSearch(formData);
  };

  // Окно фильтров: закрытие по клику вне и Escape
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

  const activeFilters = formData.status ? 1 : 0;
  const activeCount = data.filter((x) => x.status === "active").length;

  return (
    <div className={styles.usersPage}>
      <div className={`${styles.main} settings-page`}>
        <div className={hc.heroWrap}>
          <PageHero
            icon={Users}
            title={t("users")}
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
            <div className={hc.heroSearch}>
              <Search size={15} />
              <input
                type="text"
                placeholder={t("search")}
                value={formData.search || ""}
                onChange={onSearchChange}
                onKeyDown={onSearchKey}
              />
            </div>
            <button
              type="button"
              ref={filterBtnRef}
              className={`${hc.heroBtn} ${filterOpen ? hc.heroBtnOn : ""}`}
              onClick={() => setFilterOpen((v) => !v)}
            >
              <Filter size={15} />
              <span>{t("filters")}</span>
              {activeFilters > 0 && <span className={hc.filterCount}>{activeFilters}</span>}
            </button>
            {canAdd && (
              <button type="button" className={hc.heroBtn} onClick={() => setModalType("add")}>
                <Plus size={15} />
                <span>{t("add")}</span>
              </button>
            )}
            <button
              type="button"
              className={hc.heroIconBtn}
              onClick={() => fetchData()}
              title={t("refresh")}
              aria-label={t("refresh")}
            >
              <RefreshCw size={16} />
            </button>
            {data.length > 0 && (
              <button
                type="button"
                className={hc.heroIconBtn}
                title={t("save")}
                aria-label={t("save")}
              >
                <Download size={16} />
              </button>
            )}
          </PageHero>

          {filterOpen && (
            <div className={hc.filterPopover} ref={filterRef}>
              <div className={hc.field}>
                <span>{t("status")}</span>
                <div className={hc.segment}>
                  {[
                    { value: "", label: t("all") },
                    { value: "true", label: t("enabled") },
                    { value: "false", label: t("disabled") },
                  ].map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      className={formData.status === value ? hc.segmentOn : ""}
                      onClick={() => setFormData((f) => ({ ...f, status: value }))}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className={hc.filterFoot}>
                <button
                  type="button"
                  className={hc.filterReset}
                  onClick={() => {
                    const next = { ...formData, status: "" };
                    setFormData(next);
                    setFilterOpen(false);
                    handleSearch(next);
                  }}
                >
                  {t("resetAllFilters")}
                </button>
                <button
                  type="button"
                  className={hc.filterApply}
                  onClick={() => {
                    setFilterOpen(false);
                    handleSearch(formData);
                  }}
                >
                  {t("apply")}
                </button>
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <Loading />
        ) : (
          <>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>№</th>
                  <th
                    className={styles.table_name_header}
                    onClick={() => handleSort("username")}
                  >
                    <span className={styles.headerContent}>
                      {t("username")}
                      <SortArrow
                        active={sortField === "username"}
                        order={sortOrder}
                      />
                    </span>
                  </th>
                  <th onClick={() => handleSort("employeeFullName")}>
                    <span className={styles.headerContent}>
                      {t("employee")}
                      <SortArrow
                        active={sortField === "employeeFullName"}
                        order={sortOrder}
                      />
                    </span>
                  </th>
                  <th onClick={() => handleSort("accessLevel")}>
                    <span className={styles.headerContent}>
                      {t("access")}
                      <SortArrow
                        active={sortField === "accessLevel"}
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
                      <td>{(currentPage - 1) * pageSize + i + 1}</td>
                      <td>{item.username}</td>
                      <td>{item.employeeFullName}</td>
                      <td>
                        {accessLevelMap[item.access_level]
                          ? t(accessLevelMap[item.access_level])
                          : "—"}
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
                    <td colSpan="11">{t("noData")}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          </>
        )}

        <div className={hc.statsLine}>
          <span>
            {t("users")} <b>{totalItems}</b>
          </span>
          <i />
          <span className={hc.statOk}>
            {t("activeCount")} <b>{activeCount}</b> / {data.length}
          </span>
          <i />
          <span className={hc.statBad}>
            {t("inactiveCount")} <b>{data.length - activeCount}</b> / {data.length}
          </span>
        </div>
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
        title={modalType === "add" ? t("addUser") : t("editUser")}
        width="600px"
      >
        {modalType === "add" && (
          <AddUser
            handleClose={() => setModalType(null)}
            onSuccess={() => {
              setTimeout(() => setModalType(null), 500);
              fetchData();
            }}
          />
        )}
        {modalType === "edit" && (
          <EditUser
            id={selectedItem}
            handleClose={() => setModalType(null)}
            onSuccess={() => {
              setTimeout(() => setModalType(null), 500);
              fetchData();
            }}
          />
        )}
      </OverlaySidebar>
    </div>
  );
};

export default UsersPage;
