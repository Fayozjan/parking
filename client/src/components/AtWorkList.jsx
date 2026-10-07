import { useEffect, useRef } from "react";

import styles from "./AtWorkList.module.scss";
import { useTranslation } from "react-i18next";
import { Icons } from "../icons/icons";

const AtWorkTable = ({ data, onClose }) => {
  const { t } = useTranslation();
  const modalRef = useRef(null);

  // Закрытие по нажатию клавиши ESC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Закрытие по клику вне окна

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <div className={styles.overlay}>
      <div className={styles.table_body} ref={modalRef}>
        <span className={styles.closeButton} onClick={onClose} style={{ display: "flex", cursor: "pointer" }}>{Icons.clear}</span>
        <h1>{t("leftWorkList")}</h1>
        <div className={styles.tableContainer}>
          <table className={styles.employee_table}>
            <thead>
              <tr>
                <th>№</th>
                <th className={styles.table_name_header}>{t("fullName")}</th>
                <th>{t("department")}</th>
                <th>{t("position")}</th>
                <th>{t("photo")}</th>
                <th>{t("entry")}</th>
                <th>{t("exit")}</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, i) => (
                <tr key={item.employeeId}>
                  <td>{i + 1}</td>
                  <td>
                    {[
                      item.employeeInfo.surname,
                      item.employeeInfo.name,
                      item.employeeInfo.patronymic,
                      item.employeeId,
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  </td>
                  <td>{item.employeeInfo.department_name}</td>
                  <td>{item.employeeInfo.position_name}</td>
                  <td>
                    {item.photo ? (
                      <img src={item.photo} alt="user-photo" />
                    ) : null}
                  </td>
                  <td>{item.firstEntry}</td>
                  <td>{item.lastExit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AtWorkTable;
