import React, { useState, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button, Badge } from "@freelance/ui";
import { calculatePlatformFee, formatCurrency } from "@freelance/core";
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
  const resultsRef = useRef<HTMLElement>(null);

  const { services, loading: servicesLoading, error: servicesError } = useServices({
    searchQuery: searchQuery || undefined,
  });

  const isUnauthorizedRedirect = (location.state as { unauthorizedRole?: boolean })?.unauthorizedRole;
  const isFreelancer = roles.includes("freelancer");
  const sampleFee = calculatePlatformFee(100);

  const handleSearch = (query: string, shouldScroll = true) => {
    setSearchQuery(query);
    if (shouldScroll) {
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
    }
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
      <section
        className={`relative overflow-hidden bg-gradient-to-b from-[#1F363D] via-[#2A4852] to-[#1F363D] text-white flex flex-col justify-center transition-all ${
          user
            ? "min-h-[calc(100vh-4rem)] py-20 sm:py-28"
            : "min-h-[calc(100vh-4rem)] py-16 sm:py-24"
        }`}
      >
        {/* Glow de fondo decorativo estilo NexaVerse */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] sm:w-[900px] h-[300px] sm:h-[450px] bg-[#40798C]/20 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center my-auto">
          <div className="text-center w-full max-w-5xl mx-auto space-y-6 flex flex-col items-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-tight sm:leading-[1.1] text-center max-w-4xl">
              Encuentra talento experto o{" "}
              <span className="text-[#9EC1A3] underline decoration-[#70A9A1] decoration-4 underline-offset-8">
                consigue proyectos
              </span>
            </h1>

            <p className="text-base sm:text-xl text-slate-200/90 max-w-3xl mx-auto font-normal text-center leading-relaxed">
              La plataforma freelance donde tus fondos se retienen de forma segura en custodia hasta que apruebes la entrega final.
            </p>

            {/* Buscador Principal Centrado y Amplio */}
            <div className="pt-2 w-full max-w-3xl sm:max-w-4xl mx-auto">
              <SearchBar
                initialValue={searchQuery}
                onSearch={handleSearch}
                placeholder="¿Qué servicio buscas hoy? (ej. Diseño de logo, App en Flutter, React...)"
              />
            </div>

            {/* Búsquedas Populares */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs sm:text-sm text-slate-200/90">
              <span className="text-[#CFE0C3] font-semibold">Tendencias:</span>
              {["Diseño UI/UX", "Desarrollo Web", "Logotipos", "Apps Móviles", "WordPress", "Traducción"].map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => handleSearch(term, true)}
                  className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-slate-100 hover:text-white transition-all text-xs cursor-pointer hover:border-[#9EC1A3]/50 shadow-2xs backdrop-blur-xs"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>

          {/* Dual Entry Points - Solo visible para visitantes no autenticados */}
          {!user && (
            <div className="grid md:grid-cols-2 gap-4 sm:gap-5 mt-8 sm:mt-10 max-w-3xl mx-auto w-full">
              {/* Card Contratar */}
              <div className="relative group overflow-hidden rounded-2xl border border-white/15 bg-white/[0.07] hover:bg-white/[0.12] backdrop-blur-md p-4 sm:p-5 shadow-lg hover:border-[#70A9A1]/60 transition-all duration-300 text-left flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className="w-8 h-8 rounded-lg bg-[#40798C]/30 border border-[#40798C]/50 flex items-center justify-center text-base">
                        💼
                      </span>
                      <span className="text-[11px] font-bold text-[#CFE0C3] uppercase tracking-wider">
                        Para Clientes
                      </span>
                    </div>
                    <span className="text-[11px] font-medium text-slate-300/70 group-hover:text-white transition-colors">
                      Contratar
                    </span>
                  </div>

                  <h2 className="text-base font-bold text-white mb-1 group-hover:text-[#CFE0C3] transition-colors">
                    Quiero contratar talento
                  </h2>
                  <p className="text-xs text-slate-200/80 leading-relaxed line-clamp-2">
                    Servicios a precio fijo con garantía Escrow. El dinero solo se libera tras tu visto bueno.
                  </p>
                </div>

                <div className="mt-3.5 pt-3 border-t border-white/10 flex items-center justify-between">
                  <a
                    href="#servicios"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#9EC1A3] hover:text-[#CFE0C3] transition-colors"
                  >
                    <span>Explorar servicios</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </a>
                </div>
              </div>

              {/* Card Trabajar */}
              <div className="relative group overflow-hidden rounded-2xl border border-white/15 bg-white/[0.07] hover:bg-white/[0.12] backdrop-blur-md p-4 sm:p-5 shadow-lg hover:border-[#9EC1A3]/60 transition-all duration-300 text-left flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className="w-8 h-8 rounded-lg bg-[#9EC1A3]/20 border border-[#9EC1A3]/40 flex items-center justify-center text-base">
                        🚀
                      </span>
                      <span className="text-[11px] font-bold text-[#CFE0C3] uppercase tracking-wider">
                        Para Freelancers
                      </span>
                    </div>
                    <span className="text-[11px] font-medium text-slate-300/70 group-hover:text-white transition-colors">
                      Trabajar
                    </span>
                  </div>

                  <h2 className="text-base font-bold text-white mb-1 group-hover:text-[#9EC1A3] transition-colors">
                    Quiero trabajar como freelancer
                  </h2>
                  <p className="text-xs text-slate-200/80 leading-relaxed line-clamp-2">
                    Publica tus paquetes, establece tus tarifas y asegura tus ingresos antes de iniciar cada entrega.
                  </p>
                </div>

                <div className="mt-3.5 pt-3 border-t border-white/10 flex items-center justify-between">
                  <Link
                    to="/register/freelancer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#9EC1A3] hover:text-[#CFE0C3] transition-colors"
                  >
                    <span>Registrarme gratis</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </Link>
                </div>
              </div>
            </div>
          )}
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
      <section ref={resultsRef} id="servicios" className="max-w-7xl mx-auto px-4 sm:px-6 py-8 scroll-mt-20">
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
                  <Link to="/register/freelancer">
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
            <span>Comisión @freelance/core calculada: <strong className="font-mono text-slate-800">{formatCurrency(sampleFee)}</strong></span>
            <span>Stack: React + Tailwind + Supabase RLS</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
