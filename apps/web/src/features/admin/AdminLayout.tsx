import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../shared/context/AuthContext";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();
  const { roles, profile } = useAuth();

  const navItems = [
    { path: "/admin", label: "📊 Métricas y Resumen", exact: true },
    { path: "/admin/disputes", label: "⚖️ Cola de Disputas", exact: false },
    { path: "/admin/users", label: "👥 Usuarios y Roles", exact: false },
    { path: "/admin/payments", label: "💳 Control de Pagos y Escrow", exact: false },
  ];

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Encabezado del Backoffice */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider mb-1">
                <span>🛡️ Centro de Control WorkIn</span>
                <span>•</span>
                <span className="text-slate-400">Backoffice Exclusivo</span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Panel de Soporte y Mediación
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Gestión centralizada de disputas, auditoría de fondos en Escrow y administración de usuarios.
              </p>
            </div>

            {/* Perfil del Operador */}
            <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 self-start sm:self-center">
              <div className="w-9 h-9 rounded-lg bg-primary text-accent flex items-center justify-center font-bold text-sm">
                {profile?.fullName?.[0]?.toUpperCase() || "A"}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 leading-none">
                  {profile?.fullName || "Operador"}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {roles.includes("admin") && (
                    <span className="text-[10px] bg-red-100 text-red-700 font-bold px-1.5 py-0.2 rounded">
                      SuperAdmin
                    </span>
                  )}
                  {roles.includes("soporte") && (
                    <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-1.5 py-0.2 rounded">
                      Soporte
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Subnavegación del Backoffice */}
          <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-100 overflow-x-auto scrollbar-none">
            {navItems.map((item) => {
              const isActive = item.exact
                ? location.pathname === item.path
                : location.pathname.startsWith(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Contenido Dinámico de la Subruta */}
        <div>{children}</div>
      </div>
    </div>
  );
}
