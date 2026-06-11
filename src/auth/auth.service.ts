import { apiClient } from "../api/client";
import type { LoginResponse } from "../types/auth";

export type LoginPayload = {
  email: string;
  password: string;
};

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>("/auth/login", payload);
  return response.data;
}

export function saveAuthSession(data: LoginResponse) {
  localStorage.setItem("accessToken", data.accessToken);
  localStorage.setItem("authUser", JSON.stringify(data.user));
}

export function getAuthUser() {
  const rawUser = localStorage.getItem("authUser");

  if (!rawUser) {
    return null;
  }

  return JSON.parse(rawUser);
}

export function logout() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("authUser");
}
