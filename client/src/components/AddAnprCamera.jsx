import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { useAlertStore } from "../stores/alertStore";

import Button from "./Button";
import GateSelect from "./GateSelect";

import styles from "./AddAnprCamera.module.scss";
import { anprCamerasApi, getActiveLocations } from "../api";

const AddAnprCamera = ({ handleClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: "",
    direction: "entry",
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
  const { showAlert } = useAlertStore();
  const { t } = useTranslation();

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const res = await getActiveLocations();
        if (res.success) {
          setDoors(res.data);
        }
      } catch (error) {
        console.error("Ошибка при получении данных:", error.message);
      }
    };

    fetchDevices();
  }, []);

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
      const res = await anprCamerasApi.add(formData);

      if (res.success) {
        showAlert(t("success"), "success");
        onSuccess();
        setTimeout(() => {
          handleClose();
        }, 1500);
      } else {
        console.log("Ошибка в ответе сервера:", res.data);
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
        <h2>{t("addAnprCamera")}</h2>
        <Button text={t("save")} type={"submit"} />
      </div>

      <div className={styles.row}>
        <div>
          <label htmlFor="name">{t("name")}</label>
          <input
            type="text"
            name="name"
            value={formData.name}
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
            value={formData.serial_number}
            onChange={handleChange}
          />
        </div>
        <div>
          <label>{t("macAddress")}</label>
          <input
            type="text"
            name="mac_address"
            value={formData.mac_address}
            onChange={handleChange}
            placeholder="AA:BB:CC:DD:EE:FF"
          />
        </div>
      </div>

      <div className={styles.row}>
        <div>
          <label htmlFor="name">{t("direction")}</label>
          <select
            name="direction"
            value={formData.direction}
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
            value={formData.min_confidence}
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
            value={formData.camera_ip}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>{t("port")}</label>
          <input
            type="text"
            name="port"
            value={formData.port}
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
          <label htmlFor="name">{t("location")}</label>
          <select
            name="location_id"
            value={formData.location_id}
            onChange={handleChange}
            required
          >
            <option value="">{t("selectLocations")}</option>
            {doors?.map((item) => (
              <option value={item.id}>{item.name}</option>
            ))}
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

export default AddAnprCamera;
