import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { DoorOpen } from "lucide-react";

import { usePermissions } from "../hooks/usePermissions";
import { useAlertStore } from "../stores/alertStore";
import { gatesApi, getActiveLocations } from "../api/index";

import GateForm from "../components/GateForm";
import Button from "../components/Button";
import Badge from "../components/Badge";
import Pagination from "../components/Pagination";
import Loading from "../components/Loading";
import Search from "../components/Search";
import SelectWithSearch from "../components/SelectWithSearch";
import CenterModal from "../components/CenterModal";
import OverlaySidebar from "../components/OverlaySidebar";
import PageHero from "../components/PageHero";
import { ActionCell } from "../components/ActionButtons";
import { Icons } from "../icons/icons";

import styles from "./AnprCamerasPage.module.scss";

const GatesPage = () => {
  const [data, setData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalItems, setTotalItems] = useState(1);
  const [loading, setLoading] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [locations, setLocations] = useState([]);
  const [formData, setFormData] = useState({ location_id: "", search: "" });

  const { t } = useTranslation();
  const { showAlert } = useAlertStore();
  const currentPath = window.location.pathname;
  const { canAdd, canEdit, canDelete } = usePermissions(currentPath);

  useEffect(() => {
    getActiveLocations().then((result) => {
      if (result.success) setLocations(result.data);
    });
  }, []);

  const fetchData = async (page = currentPage, filters = formData, size = pageSize) => {
    setLoading(true);
    try {
      const { data, pagination } = await gatesApi.get({ page, pageSize: size, filters });
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

  const handleDelete = async (id) => {
    try {
      await gatesApi.delete(id);
      showAlert(t("success"), "success");
      setShowModal(false);
      fetchData();
    } catch (err) {
      console.error("Ошибка при удалении:", err);
      showAlert(t("error"), "error");
    }
  };

  const handleSearch = (filters = formData) => {
    setCurrentPage(1);
    fetchData(1, filters, pageSize);
  };

  const setLocationAndSearch = (updater) => {
    const updated = typeof updater === "function" ? updater(formData) : updater;
    setFormData(updated);
    handleSearch(updated);
  };

  const handleChangePageSize = (e) => {
    const size = parseInt(e.target.value, 10);
    setPageSize(size);
    setCurrentPage((prev) => Math.min(prev, Math.ceil(totalItems / size)));
  };

  return (
    <div className={styles.anprCamerasPage}>
      {loading ? (
        <Loading />
      ) : (
        <div className={`${styles.main} settings-page`}>
          <PageHero icon={DoorOpen} title={t("gates")} />

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
            </div>

            <Pagination
              currentPage={currentPage}
              pageSize={pageSize}
              totalItems={totalItems}
              totalPages={totalPages}
              handleChangePageSize={handleChangePageSize}
              handlePageChange={(page) => page >= 1 && page <= totalPages && setCurrentPage(page)}
            />

            <div className={styles.buttonsWrapper}>
              {canAdd && <Button text={t("add")} onClick={() => setModalType("add")} />}
              <div className={styles.refreshBtn} onClick={() => fetchData()}>
                {Icons.refresh}
              </div>
            </div>
          </div>

          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>№</th>
                  <th>{t("name")}</th>
                  <th>{t("location")}</th>
                  <th>{t("gateCamerasCount")}</th>
                  <th>{t("coopEnabled")}</th>
                  <th>{t("coopWindowSec")}</th>
                  <th>{t("maneuverWindowSec")}</th>
                  <th>{t("status")}</th>
                  {(canEdit || canDelete) && <th>{t("action")}</th>}
                </tr>
              </thead>
              <tbody>
                {data.length > 0 ? (
                  data.map((item, i) => (
                    <tr key={item.id}>
                      <td>{i + 1}</td>
                      <td>{item.name}</td>
                      <td>{item.location_name}</td>
                      <td>
                        {item.cameras.length > 0
                          ? item.cameras.map((c) => `${c.name} (${t(c.direction)})`).join(", ")
                          : "—"}
                      </td>
                      <td>
                        <Badge text={item.coop_enabled} />
                      </td>
                      <td>{item.coop_window_sec}</td>
                      <td>{item.maneuver_window_sec}</td>
                      <td>
                        <Badge text={item.status} />
                      </td>
                      <ActionCell
                        item={item}
                        canEdit={canEdit}
                        canDelete={canDelete}
                        onEdit={(id) => {
                          setSelectedItem(id);
                          setModalType("edit");
                        }}
                        onDelete={(id) => {
                          setSelectedItem(id);
                          setShowModal(true);
                        }}
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
        </div>
      )}

      <CenterModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onAccept={() => handleDelete(selectedItem)}
        title={t("areYouSureDelete")}
      />
      <OverlaySidebar isOpen={modalType !== null} onClose={() => setModalType(null)} width="500px">
        {modalType === "add" && (
          <GateForm handleClose={() => setModalType(null)} onSuccess={() => fetchData()} />
        )}
        {modalType === "edit" && (
          <GateForm id={selectedItem} handleClose={() => setModalType(null)} onSuccess={() => fetchData()} />
        )}
      </OverlaySidebar>
    </div>
  );
};

export default GatesPage;
