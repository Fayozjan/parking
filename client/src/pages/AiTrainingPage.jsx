import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Database, Download, RefreshCw } from "lucide-react";
import { usePermissions } from "../hooks/usePermissions";
import { useAlertStore } from "../stores/alertStore";
import { getAiTrainingSummary, getAiTrainingPlan, aiTrainingExportUrl } from "../api";
import Loading from "../components/Loading";
import PageHero from "../components/PageHero";
import styles from "./AiTrainingPage.module.scss";

const PART = 500; // кадров в одном zip
const CURSOR_KEY = "aiTrainingCursor";

// Курсор «уже скачано до этого кадра» живёт в браузере: это удобство, а не данные
const readCursor = () => {
  try {
    return localStorage.getItem(CURSOR_KEY) || "";
  } catch {
    return "";
  }
};
const writeCursor = (value) => {
  try {
    if (value) localStorage.setItem(CURSOR_KEY, value);
    else localStorage.removeItem(CURSOR_KEY);
  } catch {
    /* без localStorage курсор просто не запоминается */
  }
};

const AiTrainingPage = () => {
  const { t } = useTranslation();
  const currentPath = window.location.pathname;
  usePermissions(currentPath);
  const { showAlert } = useAlertStore();

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ enabled: true, total: 0, days: [] });
  const [cursor, setCursor] = useState(readCursor);
  const [plan, setPlan] = useState({ count: 0, last_id: null, has_more: false });

  const load = useCallback(
    async (after) => {
      setLoading(true);
      try {
        const [s, p] = await Promise.all([
          getAiTrainingSummary(),
          getAiTrainingPlan({ after, limit: PART }),
        ]);
        setSummary(s);
        setPlan(p);
      } catch (err) {
        console.error("AI training load error:", err);
        showAlert(t("error"), "error");
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    load(cursor);
  }, [load, cursor]);

  const startDownload = (params) => {
    window.location.href = aiTrainingExportUrl(params);
  };

  // Сначала plan (он же обновляет токен доступа), затем скачивание ровно того набора, что показан в plan
  const downloadNew = async () => {
    try {
      const p = await getAiTrainingPlan({ after: cursor, limit: PART });
      if (!p.count) return load(cursor);
      startDownload({ after: cursor, until: p.last_id, limit: PART });
      writeCursor(p.last_id);
      setCursor(p.last_id);
    } catch (err) {
      console.error("AI training download error:", err);
      showAlert(t("error"), "error");
    }
  };

  const downloadDay = async (day) => {
    try {
      await getAiTrainingPlan({ from: day, to: day, limit: PART });
      startDownload({ from: day, to: day, limit: PART });
    } catch (err) {
      console.error("AI training download error:", err);
      showAlert(t("error"), "error");
    }
  };

  const resetCursor = () => {
    writeCursor("");
    setCursor("");
  };

  if (loading && summary.total === 0 && !plan.count) return <Loading />;

  return (
    <div className={styles.page}>
      <div className={`${styles.main} settings-page`}>
        <PageHero icon={Database} title={t("ai-training")}>
          <button className={styles.refreshBtn} onClick={() => load(cursor)} title={t("refresh")}>
            <RefreshCw size={18} />
          </button>
        </PageHero>

        {!summary.enabled && <div className={styles.notice}>{t("aiTrainingDisabled")}</div>}

        <div className={styles.cards}>
          <div className={styles.card}>
            <div className={styles.cardLabel}>{t("aiTrainingNew")}</div>
            <div className={styles.cardValue}>
              {plan.count}
              {plan.has_more ? "+" : ""}
            </div>
            <div className={styles.cardHint}>
              {plan.count === 0 ? t("aiTrainingNothingNew") : t("aiTrainingNewHint")}
            </div>
            <button className={styles.primaryBtn} onClick={downloadNew} disabled={plan.count === 0}>
              <Download size={16} />
              {t("aiTrainingDownload")}
              {plan.count > 0 ? ` (${plan.count})` : ""}
            </button>
            {plan.has_more && <div className={styles.cardHint}>{t("aiTrainingMore")}</div>}
            {cursor && (
              <button className={styles.linkBtn} onClick={resetCursor}>
                {t("aiTrainingResetCursor")}
              </button>
            )}
          </div>

          <div className={styles.card}>
            <div className={styles.cardLabel}>{t("aiTrainingTotal")}</div>
            <div className={styles.cardValue}>{summary.total}</div>
            <div className={styles.cardHint}>{t("aiTrainingNextStep")}</div>
          </div>
        </div>

        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{t("aiTrainingDay")}</th>
                <th>{t("aiTrainingFrames")}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {summary.days.map((d) => (
                <tr key={d.day}>
                  <td>{d.day}</td>
                  <td>{d.count}</td>
                  <td>
                    <button
                      className={styles.rowBtn}
                      onClick={() => downloadDay(d.day)}
                      title={d.count > PART ? t("aiTrainingDayHint", { count: PART }) : undefined}
                    >
                      <Download size={14} />
                      {t("aiTrainingDownload")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AiTrainingPage;
