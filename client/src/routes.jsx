import { Route } from "react-router-dom";

import HomePage from "./pages/HomePage";
import UsersPage from "./pages/UsersPage";
import VehiclePassesPage from "./pages/VehiclePassesPage";
import LocationsPage from "./pages/LocationsPage";
import AnprCamerasPage from "./pages/AnprCamerasPage";
import AuditLogsPage from "./pages/AuditLogsPage";
import FinancePage from "./pages/FinancePage";
import NotFoundPage from "./pages/NotFoundPage";
import VehicleWhitelistPage from "./pages/VehicleWhitelistPage";
import CameraLogsPage from "./pages/CameraLogsPage";
// import LocationTariffPage from "./pages/LocationTariffPage";

const Routes = [
  <Route path="home" element={<HomePage />} key="home" />,
  <Route path="users" element={<UsersPage />} key="users" />,
  <Route
    path="vehicle-passes"
    element={<VehiclePassesPage />}
    key="vehicle-passes"
  />,
  <Route path="locations" element={<LocationsPage />} key="locations" />,
  <Route
    path="vehicle-cameras"
    element={<AnprCamerasPage />}
    key="vehicle-cameras"
  />,
  <Route path="audit-logs" element={<AuditLogsPage />} key="audit-logs" />,
  <Route path="vehicle-whitelist" element={<VehicleWhitelistPage />} key="vehicle-whitelist" />,
  <Route path="camera-logs" element={<CameraLogsPage />} key="camera-logs" />,
  <Route path="finance" element={<FinancePage />} key="finance" />,
  // <Route
  //   path="location-tariffs"
  //   element={<LocationTariffPage />}
  //   key="location-tariffs"
  // />,

  <Route path="*" element={<NotFoundPage />} />,
];

export default Routes;
