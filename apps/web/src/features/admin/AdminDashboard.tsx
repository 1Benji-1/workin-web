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

        {/* Tarjetas de Métricas Principales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Escrow Held */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Fondos en Escrow (Simulado)
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm">
                💰
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900 mt-2">
              {isLoading ? "..." : formatCurrency(metrics?.financials.escrow_held ?? 0)}
            </p>
            <div className="mt-2 flex items-center gap-1 text-[11px] text-slate-500">
              <span>Liberado histórico:</span>
              <span className="font-semibold text-slate-700">
                {formatCurrency(metrics?.financials.escrow_released ?? 0)}
              </span>
            </div>
          </div>

          {/* Card 2: Platform Fees */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Comisiones de Plataforma (10%)
              </span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                📈
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900 mt-2">
              {isLoading ? "..." : formatCurrency(metrics?.financials.platform_fees ?? 0)}
            </p>
            <div className="mt-2 text-[11px] text-emerald-600 font-semibold">
              Ingresos brutos retenidos por WorkIn
            </div>
          </div>

          {/* Card 3: Open Disputes */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Disputas Abiertas
              </span>
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-sm">
                ⚠️
              </div>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <p className="text-2xl font-black text-slate-900">
                {isLoading ? "..." : metrics?.disputes.open ?? 0}
              </p>
              {(metrics?.disputes.open ?? 0) > 0 && (
                <span className="text-[10px] bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full">
                  Atención requerida
                </span>
              )}
            </div>
            <div className="mt-2 text-[11px] text-slate-500">
              Casos resueltos: <span className="font-semibold">{metrics?.disputes.resolved ?? 0}</span>
            </div>
          </div>

          {/* Card 4: Total Users */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Usuarios Registrados
              </span>
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-sm">
                👥
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900 mt-2">
              {isLoading ? "..." : metrics?.users.total ?? 0}
            </p>
            <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500">
              <span>{metrics?.users.clients ?? 0} clientes</span>
              <span>•</span>
              <span>{metrics?.users.freelancers ?? 0} freelancers</span>
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
