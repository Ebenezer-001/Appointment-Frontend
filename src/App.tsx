import { Navigate, Route, Routes } from "react-router-dom";

import LoginPage from "./auth/LoginPage";
import ProtectedRoute from "./routes/ProtectedRoute";
import SuperAdminDashboardPage from "./features/super-admin/pages/SuperAdminDashboardPage";
import BusinessAdminDashboardPage from "./features/business-admin/pages/BusinessAdminDashboardPage";
import PublicBookingPage from "./features/public-booking/pages/PublicBookingPage";
import DashboardLayout from "./components/layout/DashboardLayout";
import StaffPage from "./features/business-admin/pages/StaffPage";
import ServicesPage from "./features/business-admin/pages/ServicesPage";
import StaffServiceAssignmentPage from "./features/business-admin/pages/StaffServiceAssignmentPage";
import AvailabilityPage from "./features/business-admin/pages/AvailabilityPage";
import UnavailablePeriodsPage from "./features/business-admin/pages/UnavailablePeriodsPage";
import AppointmentsPage from "./features/business-admin/pages/AppointmentsPage";
import ManageBookingPage from "./features/public-booking/pages/ManageBookingPage";
import BusinessesPage from "./features/super-admin/pages/BusinessesPage";
import BusinessActivityPage from "./features/super-admin/pages/BusinessActivityPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route path="/login" element={<LoginPage />} />

      <Route path="/book/:bookingSlug" element={<PublicBookingPage />} />
      <Route path="/book/:bookingSlug/manage" element={<ManageBookingPage />} />

      <Route element={<ProtectedRoute allowedRoles={["SUPER_ADMIN"]} />}>
        <Route element={<DashboardLayout />}>
          <Route
            path="/super-admin/dashboard"
            element={<SuperAdminDashboardPage />}
          />
          <Route path="/super-admin/businesses" element={<BusinessesPage />} />
          <Route
            path="/super-admin/businesses/:businessId/activity"
            element={<BusinessActivityPage />}
          />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["BUSINESS_ADMIN"]} />}>
        <Route element={<DashboardLayout />}>
          <Route
            path="/business-admin/dashboard"
            element={<BusinessAdminDashboardPage />}
          />
          <Route path="/business-admin/staff" element={<StaffPage />} />
          <Route path="/business-admin/services" element={<ServicesPage />} />
          <Route
            path="/business-admin/staff-services"
            element={<StaffServiceAssignmentPage />}
          />
          <Route
            path="/business-admin/availability"
            element={<AvailabilityPage />}
          />
          <Route
            path="/business-admin/unavailable-periods"
            element={<UnavailablePeriodsPage />}
          />
          <Route
            path="/business-admin/appointments"
            element={<AppointmentsPage />}
          />
        </Route>
      </Route>
    </Routes>
  );
}
