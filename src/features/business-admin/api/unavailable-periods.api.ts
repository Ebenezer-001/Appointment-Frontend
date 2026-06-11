import { apiClient } from "../../../api/client";
import type { Staff } from "./staff.api";

export type UnavailablePeriod = {
  id: string;
  businessId: string;
  staffId: string;
  startDateTime: string;
  endDateTime: string;
  reason?: string;
  createdAt: string;
  updatedAt: string;
  staff?: Staff;
};

export type CreateUnavailablePeriodPayload = {
  staffId: string;
  startDateTime: string;
  endDateTime: string;
  reason?: string;
};

export type UpdateUnavailablePeriodPayload =
  Partial<CreateUnavailablePeriodPayload>;

export async function getUnavailablePeriods() {
  const response = await apiClient.get<UnavailablePeriod[]>(
    "/business-admin/unavailable-periods"
  );

  return response.data;
}

export async function getStaffUnavailablePeriods(staffId: string) {
  const response = await apiClient.get<UnavailablePeriod[]>(
    `/business-admin/staff/${staffId}/unavailable-periods`
  );

  return response.data;
}

export async function createUnavailablePeriod(
  payload: CreateUnavailablePeriodPayload
) {
  const response = await apiClient.post<UnavailablePeriod>(
    "/business-admin/unavailable-periods",
    payload
  );

  return response.data;
}

export async function updateUnavailablePeriod(
  unavailablePeriodId: string,
  payload: UpdateUnavailablePeriodPayload
) {
  const response = await apiClient.patch<UnavailablePeriod>(
    `/business-admin/unavailable-periods/${unavailablePeriodId}`,
    payload
  );

  return response.data;
}

export async function deleteUnavailablePeriod(unavailablePeriodId: string) {
  const response = await apiClient.delete<{ message: string }>(
    `/business-admin/unavailable-periods/${unavailablePeriodId}`
  );

  return response.data;
}
