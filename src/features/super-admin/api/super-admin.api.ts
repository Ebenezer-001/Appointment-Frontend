/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiClient } from "../../../api/client";

export type BusinessStatus = "ACTIVE" | "INACTIVE";

export type Business = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  businessType?: string;
  bookingSlug: string;
  status: BusinessStatus;
  createdAt: string;
  updatedAt: string;
};

export type BusinessAdmin = {
  id: string;
  fullName: string;
  email: string;
  role: "BUSINESS_ADMIN";
  businessId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SuperAdminDashboardResponse = {
  businesses: {
    total: number;
    active: number;
    inactive: number;
  };
  businessAdmins: {
    total: number;
    active: number;
    inactive: number;
  };
  appointments: {
    total: number;
    confirmed: number;
    cancelled: number;
    completed: number;
  };
  recentBusinesses: Business[];
  recentAppointments: any[];
};

export type CreateBusinessPayload = {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  businessType?: string;
};

export type CreateBusinessAdminPayload = {
  fullName: string;
  email: string;
  password: string;
  businessId: string;
  role: string;
};

export type BusinessActivityResponse = {
  business: Business;
  businessAdmins: BusinessAdmin[];
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
  };
  recentAppointments: any[];
};

export async function getSuperAdminDashboard() {
  const response = await apiClient.get<SuperAdminDashboardResponse>(
    "/super-admin/dashboard"
  );

  return response.data;
}

export async function getBusinesses() {
  const response = await apiClient.get<Business[]>("/super-admin/businesses");
  return response.data;
}

export async function createBusiness(payload: CreateBusinessPayload) {
  const response = await apiClient.post<Business>(
    "/super-admin/businesses",
    payload
  );

  return response.data;
}

export async function updateBusinessStatus(
  businessId: string,
  status: BusinessStatus
) {
  const response = await apiClient.patch<Business>(
    `/super-admin/businesses/${businessId}/status`,
    { status }
  );

  return response.data;
}

export async function createBusinessAdmin(payload: CreateBusinessAdminPayload) {
  const response = await apiClient.post<BusinessAdmin>(
    "/super-admin/business-admins",
    payload
  );

  return response.data;
}

export async function getBusinessActivity(businessId: string) {
  const response = await apiClient.get<BusinessActivityResponse>(
    `/super-admin/businesses/${businessId}/activity`
  );

  return response.data;
}
