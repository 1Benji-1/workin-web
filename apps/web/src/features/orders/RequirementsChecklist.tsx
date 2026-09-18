import React, { useState } from "react";
import type { OrderRequirement } from "@freelance/types";
import { Button } from "@freelance/ui";

interface RequirementsChecklistProps {
  requirements: OrderRequirement[];
  onToggle: (id: string, currentVal: boolean) => Promise<{ success: boolean; error?: string }>;
  onAdd: (description: string) => Promise<{ success: boolean; error?: string }>;
  canEdit?: boolean;
  isFreelancer?: boolean;
}

export function RequirementsChecklist({
  requirements,
  onToggle,
  onAdd,
  canEdit = true,
  isFreelancer = false,
}: RequirementsChecklistProps) {
  const [newDesc, setNewDesc] = useState("");
  const [adding, setAdding] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const completedCount = requirements.filter((r) => r.isCompleted).length;
  const totalCount = requirements.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleAddRequirement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDesc.trim()) return;
    setAdding(true);
    await onAdd(newDesc.trim());
    setNewDesc("");
    setAdding(false);
  };

  const handleToggle = async (id: string, currentVal: boolean) => {
    setTogglingId(id);
    await onToggle(id, currentVal);
    setTogglingId(null);
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <h3 className="font-bold text-slate-900 text-base">
            Checklist de Entregables y Requerimientos
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {isFreelancer
              ? "Marca cada entregable conforme avances y completes el trabajo acordado."
              : "Avance reportado por el profesional (modo lectura para seguimiento del cliente)."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-700">
            {completedCount} de {totalCount} completados
          </span>
          <span className="text-xs font-bold text-primary px-2 py-0.5 rounded bg-primary/10">
            {progressPercent}%
          </span>
        </div>
      </div>

      {/* Barra de progreso */}
      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
        <div
          className="bg-accent h-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Lista de Requerimientos */}
      <div className="space-y-2.5 pt-2">
        {requirements.length > 0 ? (
          requirements.map((req) => (
            <label
              key={req.id}
              className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                canEdit ? "cursor-pointer" : "cursor-default"
              } ${
                req.isCompleted
                  ? "bg-slate-50/80 border-slate-200 text-slate-400"
                  : "bg-white border-slate-200 hover:border-slate-300 text-slate-800"
              }`}
            >
              <input
                type="checkbox"
                checked={req.isCompleted}
                disabled={!canEdit || togglingId === req.id}
                onChange={() => canEdit && handleToggle(req.id, req.isCompleted)}
                className={`mt-0.5 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary ${
                  canEdit ? "cursor-pointer" : "cursor-default opacity-75"
                }`}
              />
              <span
                className={`text-xs leading-relaxed flex-1 ${
                  req.isCompleted ? "line-through text-slate-400" : "font-medium"
                }`}
              >
                {req.description}
              </span>
            </label>
          ))
        ) : (
          <p className="text-xs text-slate-400 py-3 text-center italic">
            No se han registrado requerimientos específicos todavía.
          </p>
        )}
      </div>

      {/* Formulario para agregar requerimiento adicional */}
      {canEdit && (
        <form onSubmit={handleAddRequirement} className="flex gap-2 pt-2 border-t border-slate-100">
          <input
            type="text"
            placeholder="Añadir nuevo entregable o requisito acordado..."
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <Button type="submit" size="sm" disabled={adding || !newDesc.trim()}>
            {adding ? "Agregando..." : "+ Agregar"}
          </Button>
        </form>
      )}
    </div>
  );
}
