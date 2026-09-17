import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button, Badge } from "@freelance/ui";
import { calculatePlatformFee } from "@freelance/core";
import { useAuth } from "../../shared/context/AuthContext";
import { useCategories } from "../../hooks/useCategories";
import { useServices } from "../../hooks/useServices";
import { SearchBar } from "../search/SearchBar";
import { ServiceCard } from "../services/ServiceCard";

export default function HomePage() {
  const { user, roles } = useAuth();
  const { categories, loading: categoriesLoading } = useCategories();
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState("");

  const { services, loading: servicesLoading, error: servicesError } = useServices({
    searchQuery: searchQuery || undefined,
  });

  const isUnauthorizedRedirect = (location.state as { unauthorizedRole?: boolean })?.unauthorizedRole;
  const isFreelancer = roles.includes("freelancer");
  const sampleFee = calculatePlatformFee(100);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Alerta si fue rebotado por RoleGuard */}
      {isUnauthorizedRedirect && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm flex items-start gap-3">
            <span className="text-xl">⚠️</span>
            <div className="space-y-1">
              <strong className="block font-semibold">Acceso Exclusivo para Freelancers</strong>
              <p>
                Para entrar al panel de freelancer debes tener activo el rol <strong>Freelancer</strong> en tu perfil.
              </p>
              <div className="pt-2">
                <Link to="/profile">
                  <Button size="sm" variant="outline" className="text-xs">
                    Activar rol en mi perfil
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white via-slate-50 to-slate-100 border-b border-slate-200 py-12 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-semibold">
              <span>🛡️</span>
              <span>Protección Escrow en cada contratación</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Encuentra talento experto o{" "}
              <span className="text-primary underline decoration-accent decoration-4">
                consigue proyectos
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
              La plataforma freelance universitaria y profesional donde tu pago se retiene de forma segura hasta que apruebes la entrega.
            </p>

            {/* Buscador Principal */}
            <div className="pt-4 max-w-2xl mx-auto">
              <SearchBar
                onSearch={handleSearch}
                placeholder="¿Qué servicio buscas hoy? (ej. Diseño de logo, App en Flutter, React...)"
              />
            </div>
          </div>

          {/* Dual Entry Points (Upwork style: Quiero contratar / Quiero trabajar) */}
          <div className="grid md:grid-cols-2 gap-6 mt-12 max-w-4xl mx-auto">
            {/* Card Contratar */}
            <div className="relative group overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-4">
                <span className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-2xl font-bold">
                  💼
                </span>
                <Badge variant="primary" size="sm">
                  Para Clientes
                </Badge>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">
                Quiero contratar talento
              </h2>
              <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                Explora paquetes de servicios con precios fijos, tiempos claros y pagos en custodia. Solo liberas el dinero cuando el trabajo esté completado.
              </p>
              <div className="flex items-center gap-3">
                <a
                  href="#servicios"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-dark transition-colors"
                >
                  Ver servicios disponibles →
                </a>
              </div>
            </div>

            {/* Card Trabajar */}
            <div className="relative group overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-4">
                <span className="w-12 h-12 rounded-xl bg-accent/10 text-accent flex items-center justify-center text-2xl font-bold">
                  🚀
                </span>
                <Badge variant="accent" size="sm">
                  Para Freelancers
                </Badge>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">
                Quiero trabajar como freelancer
              </h2>
              <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                Publica tus habilidades en paquetes de servicio, define tus precios y trabaja con la tranquilidad de que el cliente ya depositó antes de comenzar.
              </p>
              <div className="flex items-center gap-3">
                {isFreelancer ? (
                  <Link to="/services/new">
                    <Button size="sm">
                      + Publicar un servicio ahora
                    </Button>
                  </Link>
                ) : user ? (
                  <Link to="/profile">
                    <Button size="sm" variant="outline">
                      Activar rol Freelancer
                    </Button>
                  </Link>
                ) : (
                  <Link to="/register">
                    <Button size="sm">
                      Registrarme para trabajar
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categorías Rápidas */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              Explora por Categoría
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Servicios organizados por especialidad con profesionales verificados
            </p>
          </div>
        </div>

        {categoriesLoading ? (
          <div className="flex justify-center py-8 text-sm text-slate-400">
            Cargando categorías...
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/categories/${cat.slug}`}
                className="group flex flex-col items-center p-4 rounded-xl border border-slate-200 bg-white hover:border-primary/40 hover:shadow-md transition-all text-center"
              >
                <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                  {cat.icon || "💼"}
                </span>
                <h3 className="font-semibold text-xs sm:text-sm text-slate-800 group-hover:text-primary transition-colors">
                  {cat.name}
                </h3>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Servicios Destacados / Recientes */}
      <section id="servicios" className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                {searchQuery ? `Resultados para "${searchQuery}"` : "Servicios Destacados"}
              </h2>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-xs text-slate-400 hover:text-slate-700 underline"
                >
                  Limpiar
                </button>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Contrata paquetes prediseñados con entrega garantizada
            </p>
          </div>

          {isFreelancer && (
            <Link to="/services/new" className="hidden sm:inline-block">
              <Button size="sm">
                + Publicar servicio
              </Button>
            </Link>
          )}
        </div>

        {servicesLoading ? (
          <div className="flex min-h-[30vh] items-center justify-center text-sm text-slate-500">
            <span className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
            Cargando servicios del marketplace...
          </div>
        ) : servicesError ? (
          <div className="p-6 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
            {servicesError}
          </div>
        ) : services.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {services.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center space-y-4">
            <span className="text-5xl block">📦</span>
            <div className="space-y-1">
              <h3 className="font-bold text-slate-800 text-base">
                {searchQuery ? "No hay resultados para esta búsqueda" : "Aún no hay servicios publicados"}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {searchQuery
                  ? "Prueba buscando con otros términos o seleccionando una categoría arriba."
                  : "Sé el primero en ofrecer tus servicios profesionales en WorkIn."}
              </p>
            </div>

            {isFreelancer ? (
              <Link to="/services/new">
                <Button size="md" className="mt-2">
                  Publicar mi primer servicio
                </Button>
              </Link>
            ) : (
              <div className="pt-2 flex justify-center gap-3">
                {user ? (
                  <Link to="/profile">
                    <Button size="sm" variant="outline">
                      Activar rol Freelancer para publicar
                    </Button>
                  </Link>
                ) : (
                  <Link to="/register">
                    <Button size="sm">
                      Registrarme como Freelancer
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Sección Informativa: Cómo Funciona el Escrow */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="rounded-2xl bg-white border border-slate-200 p-8 sm:p-12 shadow-sm">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              ¿Cómo funciona el Sistema Escrow?
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Seguridad total para clientes y freelancers en 3 sencillos pasos
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center space-y-3 p-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-2xl font-black">
                1
              </div>
              <h3 className="font-bold text-slate-800 text-base">Acuerdo y Requerimientos</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                El cliente elige el paquete de servicio o acuerdan requerimientos y plazos claros sin sorpresas.
              </p>
            </div>

            <div className="text-center space-y-3 p-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-accent/15 text-accent flex items-center justify-center text-2xl font-black">
                2
              </div>
              <h3 className="font-bold text-slate-800 text-base">Pago Seguro en Custodia</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                El cliente deposita los fondos, los cuales quedan retenidos por la plataforma. El freelancer trabaja sabiendo que el pago está garantizado.
              </p>
            </div>

            <div className="text-center space-y-3 p-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-2xl font-black">
                3
              </div>
              <h3 className="font-bold text-slate-800 text-base">Entrega y Liberación</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                El freelancer entrega el trabajo. El cliente revisa y aprueba para liberar los fondos, con mediación de soporte si surge alguna disputa.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Diagnóstico técnico Monorepo & Core (Pie de página) */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        <div className="p-4 rounded-xl border border-slate-200 bg-white/60 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>WorkIn Monorepo · Fase 0, 1 y 2 Integradas</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Comisión @freelance/core calculada: <strong className="font-mono text-slate-800">${sampleFee} USD</strong></span>
            <span>Stack: React + Tailwind + Supabase RLS</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
