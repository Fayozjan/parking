import { Route } from "react-router-dom";

import UsersPage from "./pages/UsersPage";
import VehiclePassesPageTelegram from "./pages/VehiclePassesPageTelegram";
import LocationsPage from "./pages/LocationsPage";
import AnprCamerasPage from "./pages/AnprCamerasPage";
import NotFoundPageTelegram from "./pages/NotFoundPageTelegram";
import HomePageTelegram from "./pages/HomePageTelegram";
import MorePageTelegram from "./pages/MorePageTelegram";
import FinancePageTelegram from "./pages/FinancePageTelegram";

const telegramRoutes = (
  <>
    <Route path="home" element={<HomePageTelegram />} key="home" />,
    <Route path="finance" element={<FinancePageTelegram />} key="finance" />,
    <Route path="more" element={<MorePageTelegram />} key="more" />,
    <Route path="users" element={<UsersPage />} key="users" />, ,
    <Route
      path="vehicle-passes"
      element={<VehiclePassesPageTelegram />}
      key="vehicle-passes"
    />
    ,
    <Route path="locations" element={<LocationsPage />} key="locations" />,
    <Route
      path="vehicle-cameras"
      element={<AnprCamerasPage />}
      key="vehicle-cameras"
    />
    ,
    <Route path="*" element={<NotFoundPageTelegram />} />,
  </>
);

export default telegramRoutes;
