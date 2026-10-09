import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { getFinanceSummary } from "../api";
import { usePermissions } from "../hooks/usePermissions";
import { useAuthStore } from "../stores/authStore";
import { SessionsModal } from "./FinancePage";
import Loading from "../components/Loading";
import styles from "./HomePage.module.scss";

const LocationSessionsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { locationId } = useParams();
  const routeLocation = useLocation();
  const [params] = useSearchParams();
  const from = params.get("from");
  const to = params.get("to") ?? from;

  // Права берём от пункта меню «Главная»
  const { canDelete, canEdit } = usePermissions("/home");
  const canViewOpenParkings = useAuthStore(
    (s) => !!s.access?.can_view_open_parkings,
  );

  // С главной локация приходит в состоянии роутера — тогда запрос summary не нужен.
  // При прямой ссылке или обновлении страницы грузим summary, как раньше.
  const passed = routeLocation.state?.parking;
  const initial =
    passed && String(passed.id) === String(locationId) ? passed : null;
  const [parking, setParking] = useState(initial);
  const [loading, setLoading] = useState(!initial);

  useEffect(() => {
    if (initial) return;
    if (!from || !to) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await getFinanceSummary({ from, to });
        const loc = (res?.locations ?? []).find(
          (l) => String(l.id) === String(locationId),
        );
        if (!cancelled) setParking(loc ?? null);
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [locationId, from, to]);

  const goBack = () => navigate(`/home?from=${from ?? ""}&to=${to ?? ""}`);

  if (loading) return <Loading />;

  if (!parking) {
    return (
      <div className={styles.page}>
        <div className={styles.empty}>
          <span className={styles.emptyDot} />
          {t("noData")}
        </div>
        <div>
          <button className={styles.applyBtn} onClick={goBack}>
            {t("back")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <SessionsModal
      asPage
      parking={parking}
      range={{ from, to }}
      currency={t("currencySymbol")}
      onClose={goBack}
      canDelete={canDelete}
      canEdit={canEdit}
      closedOnly={!canViewOpenParkings}
    />
  );
};

export default LocationSessionsPage;
