import styles from "./UzPlate.module.scss";

// Флаг справа на знаке: синяя, белая и зелёная полосы
const Flag = () => (
  <svg className={styles.flag} viewBox="0 0 20 14" aria-hidden="true">
    <rect width="20" height="4.4" rx="0.6" fill="#1eb5e8" />
    <rect y="1.7" x="1.5" width="6" height="1" fill="#fff" />
    <rect y="5.4" width="20" height="3.4" fill="#fff" stroke="#c9d3d9" strokeWidth="0.3" />
    <rect y="9.8" width="20" height="4.2" rx="0.6" fill="#1eb644" />
  </svg>
);

// Разбор номера: 01 A 123 BC (физлица) / 01 123 ABC (юрлица) / 8570BA50 (регион в конце)
const parsePlate = (plate) => {
  const s = (plate ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  const priv = s.match(/^(\d{2})([A-Z])(\d{3})([A-Z]{2})$/);
  if (priv) return { region: priv[1], main: `${priv[2]} ${priv[3]} ${priv[4]}` };
  const corp = s.match(/^(\d{2})(\d{3})([A-Z]{3})$/);
  if (corp) return { region: corp[1], main: `${corp[2]} ${corp[3]}` };
  // 8570BA50 → 50 | 857 BA (регион в конце)
  const tail = s.match(/^(\d{3,4})([A-Z]{2})(\d{2})$/);
  if (tail) return { region: tail[3], main: `${tail[1]} ${tail[2]}` };
  return null;
};

const UzPlate = ({ plate, size = "md" }) => {
  if (!plate) return <span>—</span>;
  const parsed = parsePlate(plate);

  return (
    <span className={`${styles.plate} ${styles[size]}`}>
      {parsed && (
        <span className={styles.region}>
          <span className={styles.txt}>{parsed.region}</span>
        </span>
      )}
      <span className={styles.main}>
        <span className={styles.txt}>{parsed ? parsed.main : plate}</span>
      </span>
      <span className={styles.side}>
        <Flag />
        <span className={styles.uz}>UZ</span>
      </span>
    </span>
  );
};

export default UzPlate;
