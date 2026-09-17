import React from "react";
import { RoleGuard } from "./RoleGuard";

interface SupportGuardProps {
  children: React.ReactNode;
}

/**
 * Guarda de seguridad que restringe el acceso exclusivamente a usuarios
 * con roles activos de Administrador ('admin') o Soporte / Mediador ('soporte').
 */
export function SupportGuard({ children }: SupportGuardProps) {
  return (
    <RoleGuard allowedRoles={["admin", "soporte"]} redirectTo="/">
      {children}
    </RoleGuard>
  );
}
