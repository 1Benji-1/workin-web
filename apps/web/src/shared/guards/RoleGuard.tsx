import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import type { Role } from "@freelance/types";
import { useAuth } from "../context/AuthContext";

interface RoleGuardProps {
  allowedRoles: Role[];
  userRoles?: Role[];
  redirectTo?: string;
  children: React.ReactNode;
}

export function RoleGuard({
  allowedRoles,
  userRoles: overrideUserRoles,
  redirectTo = "/",
  children,
}: RoleGuardProps) {
  const { user, roles, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
          <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          Verificando permisos...
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const effectiveRoles = overrideUserRoles || roles;
  const hasAccess = allowedRoles.some((role) => effectiveRoles.includes(role));

  if (!hasAccess) {
    return <Navigate to={redirectTo} state={{ unauthorizedRole: true }} replace />;
  }

  return <>{children}</>;
}
