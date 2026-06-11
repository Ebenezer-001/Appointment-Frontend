import { Navigate, Outlet } from "react-router-dom";
import { getAuthUser } from "../auth/auth.service";
import type { AuthUser, UserRole } from "../types/auth";

type ProtectedRouteProps = {
  allowedRoles: UserRole[];
};

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const user = getAuthUser() as AuthUser;
  const token = localStorage.getItem("accessToken");

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
