import { apiClient } from "../../../api/client";

export type BusinessService = {
  id: string;
  businessId: string;
  name: string;
  description?: string;
  durationMinutes: number;
  price: string | number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateServicePayload = {
  name: string;
  description?: string;
  durationMinutes: number;
  price: number;
};

export type UpdateServicePayload = Partial<CreateServicePayload> & {
  isActive?: boolean;
};

export async function getServices() {
  const response = await apiClient.get<BusinessService[]>(
    "/business-admin/services"
  );

  return response.data;
}

export async function createService(payload: CreateServicePayload) {
  const response = await apiClient.post<BusinessService>(
    "/business-admin/services",
    payload
  );

  return response.data;
}

export async function updateService(
  serviceId: string,
  payload: UpdateServicePayload
) {
  const response = await apiClient.patch<BusinessService>(
    `/business-admin/services/${serviceId}`,
    payload
  );

  return response.data;
}

export async function deleteService(serviceId: string) {
  const response = await apiClient.delete<{ message: string }>(
    `/business-admin/services/${serviceId}`
  );

  return response.data;
}
