import { apiClient } from "../../../api/client";

export type DashboardAppointment = {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  startDateTime: string;
  endDateTime: string;
  status: string;
  bookingReference: string;
  staff?: {
    id: string;
    fullName: string;
  };
  service?: {
    id: string;
    name: string;
    durationMinutes: number;
  };
};

export type BusinessAdminDashboardResponse = {
  staff: {
    total: number;
    active: number;
    inactive: number;
  };
  services: {
    total: number;
    active: number;
    inactive: number;
  };
  appointments: {
    total: number;
    pending: number;
    confirmed: number;
    cancelled: number;
    completed: number;
    upcoming: number;
    today: number;
  };
  recentAppointments: DashboardAppointment[];
};

export async function getBusinessAdminDashboard() {
  const response = await apiClient.get<BusinessAdminDashboardResponse>(
    "/business-admin/reports/dashboard"
  );

  return response.data;
}
