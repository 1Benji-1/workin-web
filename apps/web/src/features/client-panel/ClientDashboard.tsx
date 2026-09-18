import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../shared/context/AuthContext";
import { Card, Badge, Button } from "@freelance/ui";

export default function ClientDashboard() {
  const { profile } = useAuth();

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
              Ruta Protegida por RoleGuard
            </span>
            <Badge variant="primary" size="sm">
              Cliente Activo
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Panel de Cliente
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Bienvenido, {profile?.fullName || "Cliente"}. Gestiona tus contrataciones y pagos en garantía.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/">
            <Button size="sm" variant="primary">
              Explorar Servicios
            </Button>
          </Link>
          <Link to="/profile">
            <Button variant="outline" size="sm">
              Editar Perfil
            </Button>
          </Link>
        </div>
      </div>

      {/* Resumen de Acciones Principales */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="p-5 bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl mb-3">
              📋
            </div>
            <h2 className="text-base font-bold text-slate-900">Mis Pedidos</h2>
            <p className="text-xs text-slate-500 mt-1">
              Revisa el estado de tus solicitudes, acuerdos vigentes y entregas pendientes de aprobación.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100">
            <Link to="/orders" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
              <span>Ir a mis pedidos</span>
              <span>→</span>
            </Link>
          </div>
        </Card>

        <Card className="p-5 bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl mb-3">
              💬
            </div>
            <h2 className="text-base font-bold text-slate-900">Mensajes y Chat</h2>
            <p className="text-xs text-slate-500 mt-1">
              Comunícate directamente con los freelancers asignados a tus proyectos en tiempo real.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100">
            <Link to="/messages" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
              <span>Abrir mensajería</span>
              <span>→</span>
            </Link>
          </div>
        </Card>

        <Card className="p-5 bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl mb-3">
              🛡️
            </div>
            <h2 className="text-base font-bold text-slate-900">Protección Escrow</h2>
            <p className="text-xs text-slate-500 mt-1">
              Tus depósitos quedan retenidos en custodia hasta que apruebes el trabajo completado.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100">
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
              <span>Garantía 100% activa</span>
              <span>✓</span>
            </span>
          </div>
        </Card>
      </div>

      {/* Banner Placeholder Informativo */}
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-8 text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-slate-200/70 text-slate-600 flex items-center justify-center text-2xl mx-auto">
          ⏳
        </div>
        <h3 className="text-lg font-bold text-slate-800">
          Panel de Cliente en Expansión
        </h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Próximamente podrás ver estadísticas de inversión en proyectos, control de facturación consolidada y sugerencias personalizadas de freelancers.
        </p>
        <div className="pt-2">
          <Link to="/">
            <Button variant="outline" size="sm" className="bg-white">
              Buscar Freelancers Disponibles
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
