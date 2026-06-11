import { apiClient } from "../../../api/client";
import type { Staff } from "./staff.api";

export type Availability = {
  id: string;
  businessId: string;
  staffId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  createdAt: string;
  updatedAt: string;
  staff?: Staff;
};

export type CreateAvailabilityPayload = {
  staffId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};

export type UpdateAvailabilityPayload = Partial<CreateAvailabilityPayload>;

export async function getAvailability() {
  const response = await apiClient.get<Availability[]>(
    "/business-admin/availability"
  );

  return response.data;
}

export async function getStaffAvailability(staffId: string) {
  const response = await apiClient.get<Availability[]>(
    `/business-admin/staff/${staffId}/availability`
  );

  return response.data;
}

export async function createAvailability(payload: CreateAvailabilityPayload) {
  const response = await apiClient.post<Availability>(
    "/business-admin/availability",
    payload
  );

  return response.data;
}

export async function updateAvailability(
  availabilityId: string,
  payload: UpdateAvailabilityPayload
) {
  const response = await apiClient.patch<Availability>(
    `/business-admin/availability/${availabilityId}`,
    payload
  );

  return response.data;
}

export async function deleteAvailability(availabilityId: string) {
  const response = await apiClient.delete<{ message: string }>(
    `/business-admin/availability/${availabilityId}`
  );

  return response.data;
}
