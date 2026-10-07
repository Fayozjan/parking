import { Icons } from "../icons/icons";
import styles from "./DownloadButton.module.scss";

const DownloadButton = ({ text = "Сохранить", onClick, loading = false }) => {
  return (
    <button
      className={`${styles.downloadBtn} ${loading ? styles.loading : ""}`}
      type="button"
      onClick={onClick}
      disabled={loading}
    >
      {loading ? <span className={styles.spinner} /> : Icons.download}
    </button>
  );
};

export default DownloadButton;
