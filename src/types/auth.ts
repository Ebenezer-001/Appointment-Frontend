export type UserRole = "SUPER_ADMIN" | "BUSINESS_ADMIN";

export type AuthUser = {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  businessId?: string;
};

export type LoginResponse = {
  accessToken: string;
  user: AuthUser;
};
