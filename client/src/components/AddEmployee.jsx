import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { useAlertStore } from "../stores/alertStore";
import { Icons } from "../icons/icons";

import {
  getActiveBranches,
  getActivePositions,
  getActiveDoors,
  getActiveWorkSchedules,
  EmployeeService,
} from "../api";

import Button from "./Button";
import MultiSelectDoors from "./MultiSelectDoors";
import CenterModal from "./CenterModal";

import styles from "./AddEmployee.module.scss";

const AddEmployee = ({ handleClose, onSuccess }) => {
  const today = new Date().toISOString().split("T")[0];
  const [formData, setFormData] = useState({ order_date: today });
  const [originalData, setOriginalData] = useState({});
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const [branches, setBranches] = useState();
  const [positions, setPositions] = useState();
  const [workSchedules, setWorkSchedules] = useState();
  const [doors, setDoors] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);
  const { t } = useTranslation();
  const { showAlert } = useAlertStore();

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const branchesRes = await getActiveBranches();
        setBranches(branchesRes.data);

        const positionsRes = await getActivePositions();
        setPositions(positionsRes.data);

        const workSchedulesRes = await getActiveWorkSchedules();
        setWorkSchedules(workSchedulesRes.data);

        const doorsRes = await getActiveDoors();
        setDoors(doorsRes.data);
      } catch (err) {
        console.log(err.message);
      }
    };

    fetchInfo();
  }, []);

  useEffect(() => {
    if (branches?.length === 1) {
      setFormData((prev) => ({
        ...prev,
        branch_id: branches[0].id,
      }));
    }
  }, [branches]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFormData((prev) => ({ ...prev, photo: file }));
    setImagePreview(URL.createObjectURL(file));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setFormData((prev) => ({ ...prev, photo: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await EmployeeService.create(formData);

      showAlert(t("success"), "success");
      onSuccess();
      setTimeout(handleClose, 1500);
    } catch (err) {
      const message =
        err.response?.data?.error || err.message || "Произошла ошибка";
      showAlert(t("error"), "error");
    }
  };

  const formChanged = JSON.stringify(formData) !== JSON.stringify(originalData);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (formChanged) {
          setShowConfirmClose(true);
        } else {
          handleClose();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [formChanged]);

  return (
    <form className={styles.addEmployee} onSubmit={handleSubmit}>
      <div className={styles.header}>
        <h2>{t("addEmployee")}</h2>
        <Button text={t("save")} type={"submit"} />
      </div>

      <div className={styles.topRow}>
        {imagePreview ? (
          <div className={styles.previewPhoto}>
            <img src={imagePreview} alt="Selected" />

            <button type="button" className={styles.deleteBtn} onClick={handleRemoveImage}>{Icons.delete}</button>
          </div>
        ) : (
          <div className={styles.uploadPhoto}>
            <label htmlFor="photo-upload">
              {Icons.uploadPhoto}
              <span>{t("uploadPhoto")}</span>
            </label>
            <input
              id="photo-upload"
              type="file"
              name="photo"
              onChange={handleFileChange}
              className={styles.hiddenInput}
            />
          </div>
        )}

        <div>
          <label>
            {t("lastName")} <span style={{ color: "red" }}>*</span>
          </label>
          <input
            type="text"
            name="last_name"
            value={formData.last_name}
            onChange={handleChange}
            required
          />

          <label>
            {t("firstName")} <span style={{ color: "red" }}>*</span>
          </label>
          <input
            type="text"
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
            required
          />

          <label>{t("middleName")}</label>
          <input
            type="text"
            name="middle_name"
            value={formData.middle_name}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className={styles.row}>
        <div>
          <label>{t("gender")}</label>
          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            defaultValue={"male"}
          >
            <option value="male">{t("male")}</option>
            <option value="female">{t("female")}</option>
          </select>
        </div>

        <div>
          <label>{t("dateOfBirth")}</label>
          <input
            type="date"
            name="date_of_birth"
            value={formData.date_of_birth}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className={styles.row}>
        <div>
          <label>
            {t("pinfl")} <span style={{ color: "red" }}>*</span>
          </label>
          <input
            type="text"
            name="pinfl"
            value={formData.pinfl}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>{t("passport")}</label>
          <input
            type="text"
            name="passport"
            value={formData.passport}
            onChange={handleChange}
          />
        </div>

        <div>
          <label>{t("passportExpiryDate")}</label>
          <input
            type="date"
            name="passport_expiry_date"
            value={formData.passport_expiry_date}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className={styles.row}>
        <div>
          <label>{t("education")}</label>
          <select
            name="education"
            value={formData.education}
            onChange={handleChange}
          >
            <option hidden value="">
              {t("select")}
            </option>
            <option value="higher">{t("higherEdu")}</option>
            <option value="secondary">{t("secondaryEdu")}</option>
            <option value="general">{t("generalEdu")}</option>
          </select>
        </div>

        <div>
          <label>{t("speciality")}</label>
          <input
            type="text"
            name="education_specialty"
            value={formData.education_specialty}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className={styles.row}>
        <div>
          <label>{t("phoneNumber")}</label>
          <input
            type="text"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
          />
        </div>
        <div>
          <label>{t("email")}</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
          />
        </div>
        <div>
          <label>{t("address")}</label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className={styles.row}>
        <div>
          <label>{t("employeeNumber")}</label>
          <input
            type="text"
            name="employee_number"
            value={formData.employee_number}
            onChange={handleChange}
          />
        </div>
        <div>
          <label>{t("orderNumber")}</label>
          <input
            type="text"
            name="order_number"
            value={formData.order_number}
            onChange={handleChange}
          />
        </div>
        <div>
          <label>
            {t("orderDate")} <span style={{ color: "red" }}>*</span>
          </label>
          <input
            type="date"
            name="order_date"
            value={formData.order_date}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className={styles.row}>
        <div>
          <label>
            {t("branch")} <span style={{ color: "red" }}>*</span>
          </label>
          <select
            name="branch_id"
            value={formData.branch_id}
            onChange={handleChange}
            required
          >
            <option value="">{t("select")}</option>
            {branches &&
              branches.map((data) => (
                <option key={data.id} value={data.id}>
                  {data.name}
                </option>
              ))}
          </select>
        </div>
        <div>
          <label>
            {t("department")} <span style={{ color: "red" }}>*</span>
          </label>
          <select
            name="department_id"
            value={formData.department_id}
            onChange={handleChange}
            disabled={!formData.branch_id}
            required
          >
            <option value="">{t("select")}</option>
            {formData?.branch_id &&
              branches &&
              branches
                .find((b) => b.id === Number(formData.branch_id))
                ?.departments.map((data) => (
                  <option key={data.id} value={data.id}>
                    {data.name}
                  </option>
                ))}
          </select>
        </div>
      </div>

      <div className={styles.row}>
        <div>
          <label>
            {t("position")} <span style={{ color: "red" }}>*</span>
          </label>
          <select
            name="position_id"
            value={formData.position_id}
            onChange={handleChange}
            required
          >
            <option value="">{t("select")}</option>
            {positions &&
              positions.map((data) => (
                <option key={data.id} value={data.id}>
                  {data.name}
                </option>
              ))}
          </select>
        </div>
        <div>
          <label>{t("workSchedule")}</label>
          <select
            name="work_schedule_id"
            value={formData.work_schedule_id}
            onChange={handleChange}
          >
            <option value="">{t("select")}</option>
            {workSchedules &&
              workSchedules.map((ws) => (
                <option key={ws.id} value={ws.id}>
                  {ws.name}
                </option>
              ))}
          </select>
        </div>
        <div>
          <label>{t("door")}</label>
          <MultiSelectDoors
            options={doors}
            selected={formData.door_ids || []}
            onChange={(newDoors) =>
              setFormData((prev) => ({ ...prev, door_ids: newDoors }))
            }
          />
        </div>
      </div>

      <CenterModal
        isOpen={showConfirmClose}
        tag={t("closeConfirmTitle")}
        onClose={() => setShowConfirmClose(false)}
        onAccept={() => {
          setShowConfirmClose(false);
          handleClose();
        }}
      ></CenterModal>
    </form>
  );
};

export default AddEmployee;
