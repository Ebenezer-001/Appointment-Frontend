import { apiClient } from "../../../api/client";
import type { Staff } from "./staff.api";
import type { BusinessService } from "./services.api";

export type StaffServiceAssignment = {
  id: string;
  businessId: string;
  staffId: string;
  serviceId: string;
  createdAt: string;
  staff?: Staff;
  service?: BusinessService;
};

export type AssignServiceToStaffPayload = {
  staffId: string;
  serviceId: string;
};

export async function assignServiceToStaff(
  payload: AssignServiceToStaffPayload
) {
  const response = await apiClient.post<StaffServiceAssignment>(
    "/business-admin/staff-services",
    payload
  );

  return response.data;
}

export async function getServicesForStaff(staffId: string) {
  const response = await apiClient.get<StaffServiceAssignment[]>(
    `/business-admin/staff/${staffId}/services`
  );

  return response.data;
}

export async function getStaffForService(serviceId: string) {
  const response = await apiClient.get<StaffServiceAssignment[]>(
    `/business-admin/services/${serviceId}/staff`
  );

  return response.data;
}

export async function removeServiceFromStaff(
  staffId: string,
  serviceId: string
) {
  const response = await apiClient.delete<{ message: string }>(
    `/business-admin/staff-services/${staffId}/${serviceId}`
  );

  return response.data;
}
