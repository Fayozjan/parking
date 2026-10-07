import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import L from "leaflet";
import { Search, X } from "lucide-react";

import styles from "./MapPickerModal.module.scss";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const DEFAULT_CENTER = [41.2995, 69.2401];
const DEFAULT_ZOOM = 12;

const MapPickerModal = ({ isOpen, onClose, onConfirm, initialLat, initialLng }) => {
  const { t } = useTranslation();
  const [marker, setMarker] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [portalEl] = useState(() => document.createElement("div"));
  const mapDivRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const searchTimerRef = useRef(null);

  useEffect(() => {
    document.body.appendChild(portalEl);
    return () => document.body.removeChild(portalEl);
  }, [portalEl]);

  useEffect(() => {
    if (!isOpen) {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
      setSearchQuery("");
      setSearchResults([]);
      return;
    }

    const lat = initialLat !== "" && initialLat != null ? Number(initialLat) : null;
    const lng = initialLng !== "" && initialLng != null ? Number(initialLng) : null;
    const initMarker = lat && lng ? { lat, lng } : null;
    setMarker(initMarker);

    const timeout = setTimeout(() => {
      if (!mapDivRef.current || mapRef.current) return;

      const center = initMarker ? [initMarker.lat, initMarker.lng] : DEFAULT_CENTER;
      const map = L.map(mapDivRef.current, { center, zoom: DEFAULT_ZOOM });
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      if (initMarker) {
        const m = L.marker([initMarker.lat, initMarker.lng], { draggable: true }).addTo(map);
        markerRef.current = m;
        m.on("dragend", () => {
          const pos = m.getLatLng();
          setMarker({ lat: pos.lat, lng: pos.lng });
        });
      }

      map.on("click", (e) => {
        const { lat: clat, lng: clng } = e.latlng;
        setMarker({ lat: clat, lng: clng });
        if (markerRef.current) {
          markerRef.current.setLatLng([clat, clng]);
        } else {
          const m = L.marker([clat, clng], { draggable: true }).addTo(map);
          markerRef.current = m;
          m.on("dragend", () => {
            const pos = m.getLatLng();
            setMarker({ lat: pos.lat, lng: pos.lng });
          });
        }
      });
    }, 50);

    return () => {
      clearTimeout(timeout);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, [isOpen]);

  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    clearTimeout(searchTimerRef.current);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    searchTimerRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`,
          { headers: { "Accept-Language": "ru,en" } }
        );
        const data = await res.json();
        setSearchResults(data);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
  }, []);

  const selectResult = (result) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    setMarker({ lat, lng });
    setSearchQuery(result.display_name);
    setSearchResults([]);

    if (mapRef.current) {
      mapRef.current.setView([lat, lng], 16);
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        const m = L.marker([lat, lng], { draggable: true }).addTo(mapRef.current);
        markerRef.current = m;
        m.on("dragend", () => {
          const pos = m.getLatLng();
          setMarker({ lat: pos.lat, lng: pos.lng });
        });
      }
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleConfirm = () => {
    if (marker) onConfirm(marker.lat, marker.lng);
    onClose();
  };

  return createPortal(
    isOpen ? (
      <div className={styles.overlay} onClick={onClose}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          <div className={styles.header}>
            <span className={styles.title}>{t("selectOnMap")}</span>
            {marker && (
              <span className={styles.coords}>
                {marker.lat.toFixed(6)}, {marker.lng.toFixed(6)}
              </span>
            )}
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.confirmBtn}
                onClick={handleConfirm}
                disabled={!marker}
              >
                {t("save")}
              </button>
              <button type="button" className={styles.cancelBtn} onClick={onClose}>
                {t("cancel")}
              </button>
            </div>
          </div>

          <div className={styles.searchWrap}>
            <div className={styles.searchInputRow}>
              <Search size={14} className={styles.searchIcon} />
              <input
                type="text"
                className={styles.searchInput}
                placeholder={t("searchLocation") ?? "Поиск места..."}
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
              {searchQuery && (
                <button type="button" className={styles.clearSearch} onClick={clearSearch}>
                  <X size={13} />
                </button>
              )}
            </div>
            {searchResults.length > 0 && (
              <ul className={styles.searchDropdown}>
                {searchResults.map((r) => (
                  <li key={r.place_id} onClick={() => selectResult(r)}>
                    {r.display_name}
                  </li>
                ))}
              </ul>
            )}
            {searching && <div className={styles.searchHint}>{t("loading") ?? "..."}</div>}
          </div>

          <div className={styles.mapWrap} ref={mapDivRef} />
        </div>
      </div>
    ) : null,
    portalEl
  );
};

export default MapPickerModal;
