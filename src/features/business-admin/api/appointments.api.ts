import { apiClient } from "../../../api/client";
import type { Staff } from "./staff.api";
import type { BusinessService } from "./services.api";

export type AppointmentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CANCELLED"
  | "COMPLETED";

export type Appointment = {
  id: string;
  businessId: string;
  staffId: string;
  serviceId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  startDateTime: string;
  endDateTime: string;
  status: AppointmentStatus;
  bookingReference: string;
  createdAt: string;
  updatedAt: string;
  staff?: Staff;
  service?: BusinessService;
};

export type GetAppointmentsQuery = {
  status?: AppointmentStatus;
  staffId?: string;
  serviceId?: string;
  from?: string;
  to?: string;
};

export type RescheduleAppointmentPayload = {
  startDateTime: string;
  staffId?: string;
  serviceId?: string;
};

export async function getAppointments(query?: GetAppointmentsQuery) {
  const response = await apiClient.get<Appointment[]>(
    "/business-admin/appointments",
    {
      params: query,
    }
  );

  return response.data;
}

export async function getAppointment(appointmentId: string) {
  const response = await apiClient.get<Appointment>(
    `/business-admin/appointments/${appointmentId}`
  );

  return response.data;
}

export async function cancelAppointment(appointmentId: string) {
  const response = await apiClient.patch<Appointment>(
    `/business-admin/appointments/${appointmentId}/cancel`
  );

  return response.data;
}

export async function completeAppointment(appointmentId: string) {
  const response = await apiClient.patch<Appointment>(
    `/business-admin/appointments/${appointmentId}/complete`
  );

  return response.data;
}

export async function rescheduleAppointment(
  appointmentId: string,
  payload: RescheduleAppointmentPayload
) {
  const response = await apiClient.patch<Appointment>(
    `/business-admin/appointments/${appointmentId}/reschedule`,
    payload
  );

  return response.data;
}
