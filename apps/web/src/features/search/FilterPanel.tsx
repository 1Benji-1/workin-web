import React from "react";
import type { Category } from "@freelance/types";

export interface FilterValues {
  categorySlug?: string;
  minPrice?: number;
  maxPrice?: number;
  maxDeliveryDays?: number;
  minRating?: number;
}

interface FilterPanelProps {
  categories: Category[];
  filters: FilterValues;
  onChange: (newFilters: Partial<FilterValues>) => void;
  onClear: () => void;
  className?: string;
}

export function FilterPanel({
  categories,
  filters,
  onChange,
  onClear,
  className = "",
}: FilterPanelProps) {
  const hasActiveFilters =
    Boolean(filters.categorySlug) ||
    Boolean(filters.minPrice) ||
    Boolean(filters.maxPrice) ||
    Boolean(filters.maxDeliveryDays) ||
    Boolean(filters.minRating);

  return (
    <aside className={`rounded-xl border border-slate-200 bg-white p-5 space-y-6 ${className}`}>
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
          <span>Filtros de Búsqueda</span>
        </h3>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs text-primary font-medium hover:underline"
          >
            Limpiar todo
          </button>
        )}
      </div>

      {/* Categoría */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
          Categoría
        </label>
        <select
          value={filters.categorySlug || ""}
          onChange={(e) => onChange({ categorySlug: e.target.value || undefined })}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">Todas las categorías</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.icon} {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Rango de Precio */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
          Rango de Precio (Bs)
        </label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            min="0"
            placeholder="Min Bs"
            value={filters.minPrice ?? ""}
            onChange={(e) =>
              onChange({ minPrice: e.target.value ? Number(e.target.value) : undefined })
            }
            className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-primary focus:outline-none"
          />
          <input
            type="number"
            min="0"
            placeholder="Max Bs"
            value={filters.maxPrice ?? ""}
            onChange={(e) =>
              onChange({ maxPrice: e.target.value ? Number(e.target.value) : undefined })
            }
            className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      {/* Tiempo de entrega */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
          Tiempo de Entrega
        </label>
        <div className="space-y-1.5 text-xs text-slate-600">
          {[
            { label: "Cualquier plazo", value: undefined },
            { label: "Hasta 24 horas", value: 1 },
            { label: "Hasta 3 días", value: 3 },
            { label: "Hasta 7 días", value: 7 },
          ].map((opt) => (
            <label key={opt.label} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="deliveryDays"
                checked={filters.maxDeliveryDays === opt.value}
                onChange={() => onChange({ maxDeliveryDays: opt.value })}
                className="text-primary focus:ring-primary h-3.5 w-3.5"
              />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Rating Mínimo */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
          Calificación
        </label>
        <div className="space-y-1.5 text-xs text-slate-600">
          {[
            { label: "Todas las calificaciones", value: undefined },
            { label: "⭐ 4.5 o más", value: 4.5 },
            { label: "⭐ 4.0 o más", value: 4.0 },
          ].map((opt) => (
            <label key={opt.label} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="minRating"
                checked={filters.minRating === opt.value}
                onChange={() => onChange({ minRating: opt.value })}
                className="text-primary focus:ring-primary h-3.5 w-3.5"
              />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
      </div>
    </aside>
  );
}
