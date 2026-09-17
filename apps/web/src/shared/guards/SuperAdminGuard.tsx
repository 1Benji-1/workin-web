import React from "react";
import { RoleGuard } from "./RoleGuard";

interface SuperAdminGuardProps {
  children: React.ReactNode;
}

/**
 * Guarda de seguridad restringida exclusivamente a Super Administradores ('admin').
 */
export function SuperAdminGuard({ children }: SuperAdminGuardProps) {
  return (
    <RoleGuard allowedRoles={["admin"]} redirectTo="/">
      {children}
    </RoleGuard>
  );
}
