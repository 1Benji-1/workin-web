import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "./AdminLayout";
import { getAdminDashboardMetrics } from "@freelance/api";
import { formatCurrency } from "@freelance/core";
import { supabase } from "../../shared/lib/supabaseClient";
import type { AdminDashboardMetrics } from "@freelance/types";
import { Button } from "@freelance/ui";

export function AdminDashboard() {
  const [metrics, setMetrics] = useState<AdminDashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    setIsLoading(true);
    setError(null);
    const { data, error: err } = await getAdminDashboardMetrics(supabase);
    if (err) {
      setError(err.message);
    } else {
      setMetrics(data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Barra de Estado y Refresco */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              Resumen Operativo Global
            </h2>
            <p className="text-xs text-slate-500">
              Datos consolidados en tiempo real del estado de la plataforma.
            </p>
          </div>
          <button
            type="button"
            onClick={fetchMetrics}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700 transition-colors shadow-sm"
          >
            <span className={isLoading ? "animate-spin" : ""}>🔄</span>
            <span>Actualizar</span>
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
            Error al consultar métricas: {error}
          </div>
        )}

        {/* Tarjetas de Métricas Principales - 4 Bloques de Color estilo diseno.png & paleta.png */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5 sm:gap-4">
          {/* Card 1: Escrow Held - #40798C */}
          <div className="bg-[#40798C] text-white p-4 sm:p-5 lg:p-6 rounded-2xl shadow-sm relative overflow-hidden transition-transform hover:-translate-y-0.5 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-[11px] sm:text-xs font-semibold text-white/90 uppercase tracking-wider truncate">
                Fondos en Escrow
              </span>
              <div className="w-8 h-8 rounded-xl bg-white/15 text-white flex items-center justify-center text-base flex-shrink-0">
                💰
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-white mt-3 truncate">
              {isLoading ? "..." : formatCurrency(metrics?.financials.escrow_held ?? 0)}
            </p>
            <div className="mt-2 flex items-center gap-1 text-[11px] text-white/80 font-medium truncate">
              <span>Liberado histórico:</span>
              <span className="font-bold text-[#CFE0C3]">
                {formatCurrency(metrics?.financials.escrow_released ?? 0)}
              </span>
            </div>
          </div>

          {/* Card 2: Platform Fees - #70A9A1 */}
          <div className="bg-[#70A9A1] text-white p-4 sm:p-5 lg:p-6 rounded-2xl shadow-sm relative overflow-hidden transition-transform hover:-translate-y-0.5 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-[11px] sm:text-xs font-semibold text-white/90 uppercase tracking-wider truncate">
                Comisiones (12%)
              </span>
              <div className="w-8 h-8 rounded-xl bg-white/15 text-white flex items-center justify-center text-base flex-shrink-0">
                📈
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-white mt-3 truncate">
              {isLoading ? "..." : formatCurrency(metrics?.financials.platform_fees ?? 0)}
            </p>
            <div className="mt-2 text-[11px] text-white/80 font-medium truncate">
              Ingresos brutos plataforma WorkIn
            </div>
          </div>

          {/* Card 3: Open Disputes - #9EC1A3 */}
          <div className="bg-[#9EC1A3] text-[#1F363D] p-4 sm:p-5 lg:p-6 rounded-2xl shadow-sm relative overflow-hidden transition-transform hover:-translate-y-0.5 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-[11px] sm:text-xs font-bold text-[#1F363D]/90 uppercase tracking-wider truncate">
                Disputas Abiertas
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#1F363D]/10 text-[#1F363D] flex items-center justify-center text-base flex-shrink-0">
                ⚠️
              </div>
            </div>
            <div className="flex items-baseline gap-2 mt-3">
              <p className="text-2xl sm:text-3xl font-black text-[#1F363D]">
                {isLoading ? "..." : metrics?.disputes.open ?? 0}
              </p>
              {(metrics?.disputes.open ?? 0) > 0 && (
                <span className="text-[10px] bg-rose-600 text-white font-bold px-2 py-0.5 rounded-full">
                  Atención requerida
                </span>
              )}
            </div>
            <div className="mt-2 text-[11px] text-[#1F363D]/80 font-medium truncate">
              Casos resueltos: <span className="font-bold">{metrics?.disputes.resolved ?? 0}</span>
            </div>
          </div>

          {/* Card 4: Total Users - #CFE0C3 */}
          <div className="bg-[#CFE0C3] text-[#1F363D] p-4 sm:p-5 lg:p-6 rounded-2xl shadow-sm relative overflow-hidden transition-transform hover:-translate-y-0.5 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-[11px] sm:text-xs font-bold text-[#1F363D]/90 uppercase tracking-wider truncate">
                Usuarios Registrados
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#1F363D]/10 text-[#1F363D] flex items-center justify-center text-base flex-shrink-0">
                👥
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-[#1F363D] mt-3">
              {isLoading ? "..." : metrics?.users.total ?? 0}
            </p>
            <div className="mt-2 flex items-center gap-2 text-[11px] text-[#1F363D]/80 font-medium truncate">
              <span>Clientes: {metrics?.users.clients ?? 0}</span>
              <span>•</span>
              <span>Freelancers: {metrics?.users.freelancers ?? 0}</span>
            </div>
          </div>
        </div>

        {/* Sección de Paneles y Accesos Rápidos */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Resumen de Órdenes */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <span>📦 Estado de Pedidos en la Plataforma</span>
            </h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-xs text-slate-600 font-medium">Órdenes Activas en Curso</span>
                <span className="text-xs font-bold text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                  {metrics?.orders.active ?? 0}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-xs text-slate-600 font-medium">Órdenes Completadas / Aprobadas</span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  {metrics?.orders.completed ?? 0}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-xs text-slate-600 font-medium">Órdenes en Disputa Formal</span>
                <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                  {metrics?.orders.disputed ?? 0}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-xs text-slate-600 font-medium">Total de Pedidos Históricos</span>
                <span className="text-xs font-bold text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                  {metrics?.orders.total ?? 0}
                </span>
              </div>
            </div>
          </div>

          {/* Accesos Rápidos para Mediación y Soporte */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <span>⚡ Acciones Rápidas del Equipo</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Acceso 1: Disputas */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
                    <span>⚖️ Mediación de Disputas</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Revisa evidencia, analiza acuerdos y emite veredictos de liberación o reembolso de fondos.
                  </p>
                </div>
                <Link to="/admin/disputes">
                  <Button size="sm" className="w-full text-xs">
                    Abrir Cola de Disputas →
                  </Button>
                </Link>
              </div>

              {/* Acceso 2: Control de Pagos */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                    <span>💳 Auditoría de Escrow</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Inspecciona cada retención en garantía, porcentajes de comisión de plataforma y transferencias a freelancers.
                  </p>
                </div>
                <Link to="/admin/payments">
                  <Button size="sm" variant="outline" className="w-full text-xs bg-white">
                    Ver Registro de Pagos →
                  </Button>
                </Link>
              </div>

              {/* Acceso 3: Usuarios y Roles */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center gap-2 text-purple-700 font-bold text-sm">
                    <span>👥 Gestión de Usuarios y Roles</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Administra permisos de operadores, asigna roles de Soporte o SuperAdmin y revisa perfiles.
                  </p>
                </div>
                <Link to="/admin/users">
                  <Button size="sm" variant="outline" className="w-full text-xs bg-white">
                    Administrar Usuarios →
                  </Button>
                </Link>
              </div>

              {/* Acceso 4: Chat de la plataforma */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center gap-2 text-indigo-700 font-bold text-sm">
                    <span>💬 Bandeja de Mensajería</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Comunícate directamente con cualquier usuario o revisa hilos de chat vinculados a pedidos.
                  </p>
                </div>
                <Link to="/messages">
                  <Button size="sm" variant="outline" className="w-full text-xs bg-white">
                    Abrir Mensajes →
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
