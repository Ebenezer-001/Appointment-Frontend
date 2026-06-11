import { apiClient } from "../../../api/client";

export type Staff = {
  id: string;
  businessId: string;
  fullName: string;
  role?: string;
  email?: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateStaffPayload = {
  fullName: string;
  role?: string;
  email?: string;
  phone?: string;
};

export type UpdateStaffPayload = Partial<CreateStaffPayload> & {
  isActive?: boolean;
};

export async function getStaff() {
  const response = await apiClient.get<Staff[]>("/business-admin/staff");
  return response.data;
}

export async function createStaff(payload: CreateStaffPayload) {
  const response = await apiClient.post<Staff>(
    "/business-admin/staff",
    payload
  );
  return response.data;
}

export async function updateStaff(
  staffId: string,
  payload: UpdateStaffPayload
) {
  const response = await apiClient.patch<Staff>(
    `/business-admin/staff/${staffId}`,
    payload
  );

  return response.data;
}

export async function deleteStaff(staffId: string) {
  const response = await apiClient.delete<{ message: string }>(
    `/business-admin/staff/${staffId}`
  );

  return response.data;
}
