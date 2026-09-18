import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../shared/context/AuthContext";
import { Card, Badge, Button } from "@freelance/ui";
import { DashboardLayout } from "../../shared/components/DashboardLayout";

export default function ClientDashboard() {
  const { profile } = useAuth();

  return (
    <DashboardLayout
      title="Panel de Cliente"
      subtitle={`Bienvenido, ${profile?.fullName || "Cliente"}. Gestiona tus contrataciones y pagos en garantía.`}
      actions={
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
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
      }
    >
      {/* 3 Bloques Principales de Resumen en la Paleta */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        <div className="bg-[#40798C] text-white p-5 sm:p-6 rounded-2xl shadow-sm flex flex-col justify-between transition-transform hover:-translate-y-0.5 min-w-0">
          <div>
            <div className="w-12 h-12 rounded-xl bg-white/15 text-white flex items-center justify-center text-2xl mb-4">
              📋
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white">Mis Pedidos</h2>
            <p className="text-xs text-white/80 mt-1 leading-relaxed">
              Revisa tus requerimientos acordados, solicitudes pendientes y entregas listas para aprobar.
            </p>
          </div>
          <div className="mt-5 sm:mt-6 pt-4 border-t border-white/15">
            <Link to="/orders" className="text-xs font-bold text-[#CFE0C3] hover:underline flex items-center gap-1.5">
              <span>Gestionar contrataciones</span>
              <span>→</span>
            </Link>
          </div>
        </div>

        <div className="bg-[#70A9A1] text-white p-5 sm:p-6 rounded-2xl shadow-sm flex flex-col justify-between transition-transform hover:-translate-y-0.5 min-w-0">
          <div>
            <div className="w-12 h-12 rounded-xl bg-white/15 text-white flex items-center justify-center text-2xl mb-4">
              💬
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white">Mensajería y Chat</h2>
            <p className="text-xs text-white/80 mt-1 leading-relaxed">
              Coordina directamente detalles, especificaciones y avances en tiempo real con cada freelancer.
            </p>
          </div>
          <div className="mt-5 sm:mt-6 pt-4 border-t border-white/15">
            <Link to="/messages" className="text-xs font-bold text-white hover:underline flex items-center gap-1.5">
              <span>Abrir sala de chat</span>
              <span>→</span>
            </Link>
          </div>
        </div>

        <div className="bg-[#9EC1A3] text-[#1F363D] p-5 sm:p-6 rounded-2xl shadow-sm flex flex-col justify-between transition-transform hover:-translate-y-0.5 min-w-0 sm:col-span-2 lg:col-span-1">
          <div>
            <div className="w-12 h-12 rounded-xl bg-[#1F363D]/10 text-[#1F363D] flex items-center justify-center text-2xl mb-4">
              🛡️
            </div>
            <h2 className="text-base sm:text-lg font-bold text-[#1F363D]">Protección Escrow</h2>
            <p className="text-xs text-[#1F363D]/80 mt-1 leading-relaxed">
              Tus depósitos quedan retenidos de forma segura. Solo se liberan cuando das tu conformidad final.
            </p>
          </div>
          <div className="mt-5 sm:mt-6 pt-4 border-t border-[#1F363D]/15">
            <span className="text-xs font-bold text-[#1F363D] flex items-center gap-1">
              <span>Garantía 100% activa</span>
              <span>✓</span>
            </span>
          </div>
        </div>
      </div>

      {/* Banner Informativo con borde suave */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-8 text-center space-y-3 shadow-2xs">
        <div className="w-12 h-12 rounded-2xl bg-[#CFE0C3]/50 text-[#1F363D] flex items-center justify-center text-2xl mx-auto">
          🔍
        </div>
        <h3 className="text-base font-bold text-[#1F363D]">
          ¿Necesitas un nuevo servicio o asesoría profesional?
        </h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Encuentra especialistas calificados con portafolios verificados y precios transparentes en bolivianos.
        </p>
        <div className="pt-2">
          <Link to="/">
            <Button variant="primary" size="sm">
              Buscar en el Marketplace
            </Button>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
