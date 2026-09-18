import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../shared/context/AuthContext";
import { Card, Badge, Button } from "@freelance/ui";
import { formatCurrency } from "@freelance/core";

export default function FreelancerDashboardDemo() {
  const { profile } = useAuth();

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
              Ruta Protegida por RoleGuard
            </span>
            <Badge variant="accent" size="sm">
              Freelancer Activo
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-primary">
            Panel de Freelancer
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Bienvenido, {profile?.fullName || "Freelancer"}. Este panel es accesible exclusivamente para usuarios con rol freelancer.
          </p>
        </div>

        <Link to="/profile">
          <Button variant="outline" size="sm">
            Editar Mi Perfil
          </Button>
        </Link>
      </div>

      {/* Resumen del Perfil Activo */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-slate-50">
          <span className="text-xs text-slate-500 font-medium">Especialidad</span>
          <p className="text-base font-bold text-primary mt-1">
            {profile?.headline || "Sin especialidad definida"}
          </p>
        </Card>

        <Card className="p-4 bg-slate-50">
          <span className="text-xs text-slate-500 font-medium">Tarifa por Hora</span>
          <p className="text-base font-bold text-accent mt-1">
            {profile?.hourlyRate ? `${formatCurrency(profile.hourlyRate)}/h` : "No configurada"}
          </p>
        </Card>

        <Card className="p-4 bg-slate-50">
          <span className="text-xs text-slate-500 font-medium">Habilidades Registradas</span>
          <p className="text-base font-bold text-slate-800 mt-1">
            {profile?.skills?.length || 0} habilidades
          </p>
        </Card>
      </div>

      {/* Próximo paso: Fase 2 */}
      <Card
        title="Estado de la Fase 1 & Preparación para Fase 2"
        description="El control de acceso por rol (RoleGuard) ha validado tu cuenta con éxito."
      >
        <div className="space-y-4 text-sm text-slate-600">
          <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm">
            ✓ <strong>RoleGuard Operativo:</strong> Si un usuario con solo rol de <code>cliente</code> intenta ingresar a esta URL (<code>/freelancer/dashboard</code>), es automáticamente redirigido y bloqueado. Al tener tu rol de <code>freelancer</code> activo, el acceso es concedido.
          </div>

          <div className="p-4 rounded-lg border border-slate-200 space-y-2">
            <h4 className="font-semibold text-slate-800 text-xs uppercase tracking-wider">
              En la Fase 2 este panel incluirá:
            </h4>
            <ul className="list-disc list-inside space-y-1 text-xs text-slate-600">
              <li>Gestión y publicación de Servicios propios (CRUD de ofertas).</li>
              <li>Recepción de órdenes de clientes con estados de entrega.</li>
              <li>Resumen financiero de fondos retenidos en Escrow y pagos liberados.</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
