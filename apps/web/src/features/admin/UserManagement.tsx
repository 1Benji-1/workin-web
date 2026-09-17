import React, { useState, useEffect, useCallback } from "react";
import { AdminLayout } from "./AdminLayout";
import { getAdminUsersList, updateUserRoleByAdmin } from "@freelance/api";
import { supabase } from "../../shared/lib/supabaseClient";
import type { AdminUserItem, Role } from "@freelance/types";
import { Button } from "@freelance/ui";

export function UserManagement() {
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [search, setSearch] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal para editar roles de un usuario
  const [editingUser, setEditingUser] = useState<AdminUserItem | null>(null);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const { data, error: err } = await getAdminUsersList(supabase, search);
    if (err) {
      setError(err.message);
    } else {
      setUsers(data || []);
    }
    setIsLoading(false);
  }, [search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleRole = async (targetUser: AdminUserItem, role: Role, currentActive: boolean) => {
    setIsUpdatingRole(true);
    try {
      const { success, error: err } = await updateUserRoleByAdmin(supabase, {
        userId: targetUser.id,
        role,
        active: !currentActive,
      });

      if (err || !success) {
        alert("Error al actualizar rol: " + (err?.message || "Operación fallida"));
        return;
      }

      // Actualizar estado local
      setEditingUser((prev) => {
        if (!prev) return null;
        const newRoles = currentActive
          ? prev.roles.filter((r) => r !== role)
          : [...prev.roles, role];
        return { ...prev, roles: newRoles };
      });

      fetchUsers();
    } finally {
      setIsUpdatingRole(false);
    }
  };

  const allAvailableRoles: { role: Role; label: string; desc: string }[] = [
    { role: "cliente", label: "Cliente", desc: "Puede explorar servicios, acordar pedidos y pagar en Escrow." },
    { role: "freelancer", label: "Freelancer", desc: "Puede publicar servicios, entregar pedidos y cobrar fondos." },
    { role: "soporte", label: "Soporte / Mediador", desc: "Acceso al backoffice para revisar y resolver disputas." },
    { role: "admin", label: "Super Administrador", desc: "Acceso total, auditoría financiera y gestión de roles." },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Cabecera y Buscador */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              Administración de Usuarios y Roles
            </h2>
            <p className="text-xs text-slate-500">
              Control de identidades, privilegios de soporte y perfiles registrados.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre..."
                className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm w-48 sm:w-64"
              />
              <span className="absolute left-2.5 top-2 text-slate-400 text-xs">🔍</span>
            </div>

            <button
              type="button"
              onClick={fetchUsers}
              className="p-2 text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-sm"
              title="Recargar usuarios"
            >
              🔄
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
            Error al consultar usuarios: {error}
          </div>
        )}

        {/* Tabla de Usuarios */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Usuario</th>
                  <th className="py-3.5 px-4">Especialidad</th>
                  <th className="py-3.5 px-4">Roles Activos</th>
                  <th className="py-3.5 px-4">Reputación</th>
                  <th className="py-3.5 px-4">Fecha Registro</th>
                  <th className="py-3.5 px-4 text-right">Permisos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading && users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      Cargando listado de usuarios...
                    </td>
                  </tr>
                ) : users.length > 0 ? (
                  users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs flex-shrink-0">
                            {u.avatarUrl ? (
                              <img src={u.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                            ) : (
                              u.fullName?.[0]?.toUpperCase() || "U"
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{u.fullName || "Usuario sin nombre"}</p>
                            <p className="text-[10px] text-slate-400 font-mono">ID: {u.id.slice(0, 8)}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 max-w-[180px]">
                        <p className="truncate">{u.headline || "Sin especialidad"}</p>
                        {u.hourlyRate && (
                          <span className="text-[10px] text-slate-400 font-medium">
                            ${u.hourlyRate}/h
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1">
                          {u.roles.map((r) => (
                            <span
                              key={r}
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                r === "admin"
                                  ? "bg-red-100 text-red-700"
                                  : r === "soporte"
                                  ? "bg-indigo-100 text-indigo-700"
                                  : r === "freelancer"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1 font-bold text-slate-800">
                          <span>⭐ {u.ratingAvg > 0 ? u.ratingAvg.toFixed(2) : "—"}</span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            ({u.reviewsCount})
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                        {new Date(u.createdAt).toLocaleDateString("es-ES", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingUser(u)}
                          className="text-xs py-1 px-2.5 bg-white"
                        >
                          ⚙️ Gestionar Roles
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No se encontraron usuarios coincidentes.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal de Gestión de Roles */}
        {editingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Gestionar Roles y Privilegios
                  </h3>
                  <p className="text-xs text-slate-500">
                    Usuario: <span className="font-semibold text-slate-800">{editingUser.fullName}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3">
                {allAvailableRoles.map(({ role, label, desc }) => {
                  const isActive = editingUser.roles.includes(role);
                  return (
                    <div
                      key={role}
                      className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        isActive ? "bg-primary/5 border-primary/30" : "bg-slate-50 border-slate-200"
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <p className="font-bold text-xs text-slate-900">{label}</p>
                        <p className="text-[11px] text-slate-500 line-clamp-1">{desc}</p>
                      </div>

                      <button
                        type="button"
                        disabled={isUpdatingRole}
                        onClick={() => handleToggleRole(editingUser, role, isActive)}
                        className={`text-xs font-bold px-3 py-1 rounded-xl transition-all ${
                          isActive
                            ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                            : "bg-slate-900 text-white hover:bg-slate-800 shadow-sm"
                        }`}
                      >
                        {isActive ? "Quitar" : "Asignar"}
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingUser(null)}
                  className="text-xs bg-white"
                >
                  Cerrar
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
