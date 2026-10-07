import styles from "./EmployeeCell.module.scss";

export default function EmployeeCell({
  photo,
  lastName,
  firstName,
  middleName,
  fullName,
  id,
  branch,
  department,
  position,
  active = true,
}) {
  const cleanName = fullName
    ? fullName.replace(/\s+\(?\d+\)?$/, "")
    : [lastName, firstName, middleName].filter(Boolean).join(" ");

  const initials = fullName
    ? cleanName
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase()
    : [lastName, firstName]
        .filter(Boolean)
        .map((n) => n[0].toUpperCase())
        .join("");

  const isInactive = active === false;

  return (
    <div className={styles.empCell}>
      <div className={`${styles.empAvatar} ${isInactive ? styles.inactive : ""}`}>
        {photo ? (
          <img
            src={`/api/employees/image/${photo}`}
            alt="employee"
            className={styles.empPhoto}
          />
        ) : (
          <div className={`${styles.empInitials} ${isInactive ? styles.inactiveInitials : ""}`}>
            {initials}
          </div>
        )}
      </div>
      <div className={styles.empInfo}>
        <span className={styles.empName}>
          {cleanName}
          {id != null && <span className={styles.empId}> ({id})</span>}
        </span>
        <span className={styles.empSub}>
          {[branch, department, position].filter(Boolean).join(" / ")}
        </span>
      </div>
    </div>
  );
}
