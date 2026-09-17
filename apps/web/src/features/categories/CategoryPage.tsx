import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useCategories } from "../../hooks/useCategories";
import { useServices } from "../../hooks/useServices";
import { ServiceCard } from "../services/ServiceCard";
import { FilterPanel, type FilterValues } from "../search/FilterPanel";
import { Button, Badge } from "@freelance/ui";
import { useAuth } from "../../shared/context/AuthContext";

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const { categories } = useCategories();
  const { roles } = useAuth();

  const currentCategory = categories.find((c) => c.slug === slug);

  const [filters, setFilters] = useState<FilterValues>({
    categorySlug: slug,
  });

  const { services, loading, error } = useServices({
    ...filters,
    categorySlug: slug,
  });

  const handleFilterChange = (updates: Partial<FilterValues>) => {
    setFilters((prev) => ({ ...prev, ...updates }));
  };

  const handleClearFilters = () => {
    setFilters({ categorySlug: slug });
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Category Hero Header */}
      <div className="rounded-2xl bg-gradient-to-r from-primary to-slate-800 text-white p-6 sm:p-10 shadow-sm relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <Link to="/" className="text-xs text-slate-300 hover:text-white transition-colors">
              Marketplace
            </Link>
            <span className="text-xs text-slate-400">/</span>
            <span className="text-xs text-accent font-semibold">Categoría</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold flex items-center gap-3">
            <span>{currentCategory?.icon || "💼"}</span>
            <span>{currentCategory?.name || "Categoría de Servicios"}</span>
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed pt-1">
            {currentCategory?.description ||
              "Encuentra profesionales calificados para tus proyectos con pago seguro en escrow."}
          </p>
        </div>
      </div>

      {/* Main Content: Filters + Grid */}
      <div className="grid lg:grid-cols-4 gap-8 items-start">
        {/* Filtros laterales */}
        <div className="lg:col-span-1">
          <FilterPanel
            categories={categories}
            filters={filters}
            onChange={handleFilterChange}
            onClear={handleClearFilters}
          />
        </div>

        {/* Grilla de Servicios */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-slate-900 text-base">
                Servicios Disponibles
              </h2>
              <Badge variant="neutral" size="sm">
                {services.length} {services.length === 1 ? "resultado" : "resultados"}
              </Badge>
            </div>

            {roles.includes("freelancer") && (
              <Link to="/services/new">
                <Button size="sm">
                  + Publicar en esta categoría
                </Button>
              </Link>
            )}
          </div>

          {loading ? (
            <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">
              <span className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
              Cargando servicios de {currentCategory?.name || "la categoría"}...
            </div>
          ) : error ? (
            <div className="p-6 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
              {error}
            </div>
          ) : services.length > 0 ? (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {services.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center space-y-4">
              <span className="text-4xl block">🔍</span>
              <div className="space-y-1">
                <h3 className="font-semibold text-slate-800 text-base">
                  No se encontraron servicios en esta categoría
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Aún no hay ofertas activas con estos filtros o nadie ha publicado en esta área todavía.
                </p>
              </div>

              {roles.includes("freelancer") ? (
                <Link to="/services/new">
                  <Button size="md" className="mt-2">
                    Sé el primer freelancer en publicar aquí
                  </Button>
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="text-xs text-primary font-medium hover:underline block mx-auto pt-2"
                >
                  Restablecer filtros
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
