import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

import { useAlertStore } from "../stores/alertStore";
import { anprCamerasApi, getActiveLocations } from "../api";

import Button from "./Button";
import GateSelect from "./GateSelect";

import styles from "./AddAnprCamera.module.scss";

const EditAnprCamera = ({ id, handleClose, onSuccess }) => {
  const { showAlert } = useAlertStore();
  const [formData, setFormData] = useState({
    name: "",
    direction: "",
    camera_ip: "",
    port: 80,
    location_id: "",
    gate_id: "",
    serial_number: "",
    mac_address: "",
    password: "",
    is_local: true,
    min_confidence: 50,
  });
  const [doors, setDoors] = useState();
  const { t } = useTranslation();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [faceDevice, doorsRes] = await Promise.all([
          anprCamerasApi.getById(id),
          getActiveLocations(),
        ]);

        if (faceDevice.success) {
          setFormData(faceDevice.data);
        } else {
          console.error("Ошибка при получении данных устройства");
        }

        if (doorsRes.success) {
          setDoors(doorsRes.data);
        } else {
          console.error("Ошибка при получении списка дверей");
        }
      } catch (error) {
        console.error("Ошибка при загрузке данных:", error.message);
        showAlert(t("error"), "error");
        setTimeout(() => handleClose(), 1500);
      }
    };

    fetchData();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: name === "is_local" ? value === "true" : value,
      // ворота принадлежат локации — при смене локации выбор сбрасываем
      ...(name === "location_id" ? { gate_id: "" } : {}),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const { name, direction, camera_ip, port, location_id, gate_id, serial_number, mac_address, password, is_local, min_confidence, status } = formData;
      const res = await anprCamerasApi.update(id, { name, direction, camera_ip, port, location_id, gate_id, serial_number, mac_address, password, is_local, min_confidence, status });

      if (res.success) {
        showAlert(t("success"), "success");
        setTimeout(() => {
          onSuccess();
          handleClose();
        }, 1500);
      }
    } catch (error) {
      console.error(
        "Ошибка при отправке данных:",
        error.response ? error.response.data : error.message,
      );
      showAlert(t("error"), "error");
    }
  };

  return (
    <form className={styles.addAnprCamera} onSubmit={handleSubmit}>
      <div className={styles.header}>
        <h2>{t("editAnprCamera")}</h2>
        <Button text={t("save")} type={"submit"} />
      </div>

      <div className={styles.row}>
        <div>
          <label htmlFor="name">{t("name")}</label>
          <input
            type="text"
            name="name"
            value={formData?.name}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>{t("password")}</label>
          <input
            type="text"
            name="password"
            value={formData.password}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className={styles.row}>
        <div>
          <label>{t("serialNumber")}</label>
          <input
            type="text"
            name="serial_number"
            value={formData.serial_number || ""}
            onChange={handleChange}
          />
        </div>
        <div>
          <label>{t("macAddress")}</label>
          <input
            type="text"
            name="mac_address"
            value={formData.mac_address || ""}
            onChange={handleChange}
            placeholder="AA:BB:CC:DD:EE:FF"
          />
        </div>
      </div>

      <div className={styles.row}>
        <div>
          <label>{t("direction")}</label>
          <select
            name="direction"
            value={formData?.direction}
            onChange={handleChange}
          >
            <option value="entry">{t("entry")}</option>
            <option value="exit">{t("exit")}</option>
          </select>
        </div>
        <div>
          <label htmlFor="min_confidence">{t("minConfidence")}</label>
          <input
            type="number"
            name="min_confidence"
            min={0}
            max={100}
            step={1}
            value={formData.min_confidence ?? 50}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className={styles.row}>
        <div>
          <label>{t("ipAddress")}</label>
          <input
            type="text"
            name="camera_ip"
            value={formData?.camera_ip}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>{t("port")}</label>
          <input
            type="text"
            name="port"
            value={formData?.port}
            onChange={handleChange}
          />
        </div>
      </div>


      <div className={styles.row}>
        <div>
          <label>{t("localDevice")}</label>
          <select
            name="is_local"
            value={formData.is_local}
            onChange={handleChange}
          >
            <option value={true}>{t("yes")}</option>
            <option value={false}>{t("no")}</option>
          </select>
        </div>
        <div>
          <label>{t("location")}</label>
          <select
            name="location_id"
            value={formData?.location_id}
            onChange={handleChange}
          >
            {doors?.map((item) => (
              <option value={item.id}>{item.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.row}>
        <div>
          <label>{t("status")}</label>
          <select
            name="status"
            value={formData?.status}
            onChange={handleChange}
          >
            <option value="true">{t("enable")}</option>
            <option value="false">{t("disable")}</option>
          </select>
        </div>
      </div>

      <div className={styles.row}>
        <GateSelect
          locationId={formData.location_id}
          value={formData.gate_id}
          onChange={handleChange}
        />
      </div>
    </form>
  );
};

export default EditAnprCamera;
