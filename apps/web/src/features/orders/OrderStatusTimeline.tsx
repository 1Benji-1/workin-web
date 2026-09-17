import React from "react";
import type { OrderStatus } from "@freelance/types";
import { getOrderStatusMeta } from "@freelance/core";
import { Badge } from "@freelance/ui";

interface OrderStatusTimelineProps {
  status: OrderStatus;
  className?: string;
}

const STEPS = [
  { label: "1. Acuerdo", description: "Alcance y Requerimientos" },
  { label: "2. Pago en Escrow", description: "Fondos en Custodia" },
  { label: "3. En Progreso", description: "Trabajo en Desarrollo" },
  { label: "4. Entregado", description: "Revisión del Cliente" },
  { label: "5. Aprobado", description: "Liberación de Fondos" },
];

export function OrderStatusTimeline({ status, className = "" }: OrderStatusTimelineProps) {
  const meta = getOrderStatusMeta(status);
  const currentStep = meta.stepIndex;
  const isDispute = status === "en_disputa";

  return (
    <div className={`rounded-xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Línea de Vida del Acuerdo
          </span>
          <div className="flex items-center gap-2 mt-0.5">
            <h3 className="text-base font-bold text-slate-900">
              Estado: {meta.label}
            </h3>
            <Badge variant={meta.badgeVariant} size="sm">
              {status}
            </Badge>
          </div>
        </div>

        <p className="text-xs text-slate-500 max-w-sm sm:text-right">
          {meta.description}
        </p>
      </div>

      {isDispute ? (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
          <span className="text-lg">⚖️</span>
          <span>
            <strong>Orden en Disputa:</strong> Se ha congelado temporalmente la liberación de fondos para revisión de soporte (Fase 5).
          </span>
        </div>
      ) : (
        <div className="pt-2 pb-1">
          <div className="grid grid-cols-5 gap-2 relative">
            {STEPS.map((step, idx) => {
              const isPast = idx < currentStep;
              const isCurrent = idx === currentStep;

              return (
                <div key={step.label} className="flex flex-col items-center text-center group">
                  {/* Circle Indicator */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isPast
                        ? "bg-emerald-600 text-white shadow-sm"
                        : isCurrent
                        ? "bg-primary text-accent ring-4 ring-primary/20 shadow-md"
                        : "bg-slate-100 text-slate-400 border border-slate-200"
                    }`}
                  >
                    {isPast ? "✓" : idx + 1}
                  </div>

                  {/* Step Label */}
                  <span
                    className={`text-xs font-semibold mt-2 ${
                      isCurrent
                        ? "text-primary"
                        : isPast
                        ? "text-slate-800"
                        : "text-slate-400"
                    }`}
                  >
                    {step.label}
                  </span>

                  {/* Step Subtitle */}
                  <span className="text-[10px] text-slate-400 hidden sm:block mt-0.5">
                    {step.description}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Progress Track Line */}
          <div className="relative mt-3 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-primary transition-all duration-500"
              style={{
                width: `${Math.min(100, Math.max(10, ((currentStep + 1) / STEPS.length) * 100))}%`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
