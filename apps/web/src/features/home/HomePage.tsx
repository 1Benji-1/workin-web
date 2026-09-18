import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { Button } from "@freelance/ui";
import { useAuth } from "../../shared/context/AuthContext";
import { useCategories } from "../../hooks/useCategories";
import { useServices } from "../../hooks/useServices";
import { ServiceCard } from "../services/ServiceCard";

/* ═══════════════════════════════════════════════
   Slides del carrusel hero (auto-scroll)
   Contenido freelancer con soporte para imágenes
   ═══════════════════════════════════════════════ */
const heroSlides = [
  {
    title: "Talento Freelancer,\nSoluciones Reales",
    subtitle:
      "Conecta con profesionales verificados listos para impulsar tus proyectos con garantía de pago seguro.",
    image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1600&q=80",
    gradient: "bg-gradient-to-br from-[#1F363D] via-[#2A5A6B] to-[#40798C]",
    accentGlow: "bg-[#70A9A1]/25",
    card: {
      icon: "🎨",
      image: "https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?auto=format&fit=crop&w=400&q=80",
      title: "Diseño & Creatividad",
      desc: "Logos, branding, interfaces UI/UX y diseño gráfico profesional.",
      highlight: "Más buscado",
    },
  },
  {
    title: "Desarrollo Web\n& Aplicaciones",
    subtitle:
      "Sitios web, apps móviles y soluciones digitales a medida con tecnologías de vanguardia.",
    image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1600&q=80",
    gradient: "bg-gradient-to-br from-[#2A4852] via-[#40798C] to-[#70A9A1]",
    accentGlow: "bg-[#9EC1A3]/25",
    card: {
      icon: "💻",
      image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=400&q=80",
      title: "Desarrollo & Tech",
      desc: "React, Flutter, WordPress y frameworks modernos a tu servicio.",
      highlight: "Alta demanda",
    },
  },
  {
    title: "Marketing Digital\n& Estrategia",
    subtitle:
      "Potencia tu marca con expertos en redes sociales, SEO y campañas publicitarias.",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1600&q=80",
    gradient: "bg-gradient-to-br from-[#1F363D] via-[#3D6B5E] to-[#9EC1A3]",
    accentGlow: "bg-[#CFE0C3]/25",
    card: {
      icon: "📈",
      image: "https://images.unsplash.com/photo-1533750516457-a7f992034fec?auto=format&fit=crop&w=400&q=80",
      title: "Marketing Digital",
      desc: "SEO, social media, email marketing y estrategia de contenido.",
      highlight: "Tendencia",
    },
  },
  {
    title: "Consultoría &\nAsesoría Profesional",
    subtitle:
      "Asesoría en finanzas, coaching empresarial, legal y planificación estratégica.",
    image: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1600&q=80",
    gradient: "bg-gradient-to-br from-[#142429] via-[#1F363D] to-[#40798C]",
    accentGlow: "bg-[#40798C]/25",
    card: {
      icon: "💼",
      image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=400&q=80",
      title: "Consultoría",
      desc: "Planes de negocio, finanzas, mentoría y servicios profesionales.",
      highlight: "Premium",
    },
  },
  {
    title: "Contenido,\nRedacción & Más",
    subtitle:
      "Copywriting profesional, traducción certificada, edición y creación de contenido.",
    image: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1600&q=80",
    gradient: "bg-gradient-to-br from-[#2A4852] via-[#557B73] to-[#70A9A1]",
    accentGlow: "bg-[#9EC1A3]/25",
    card: {
      icon: "✍️",
      image: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=400&q=80",
      title: "Redacción & Contenido",
      desc: "Copywriting, blogs, traducción y redacción creativa profesional.",
      highlight: "Popular",
    },
  },
];

export default function HomePage() {
  const { user, roles } = useAuth();
  const { categories, loading: categoriesLoading } = useCategories();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [searchQuery, setSearchQuery] = useState("");
  const [currentSlide, setCurrentSlide] = useState(0);
  const resultsRef = useRef<HTMLElement>(null);

  const {
    services,
    loading: servicesLoading,
    error: servicesError,
  } = useServices({
    searchQuery: searchQuery || undefined,
  });

  const isUnauthorizedRedirect = (
    location.state as { unauthorizedRole?: boolean }
  )?.unauthorizedRole;
  const isFreelancer = roles.includes("freelancer");

  // Leer query de búsqueda desde URL (viene del Navbar)
  useEffect(() => {
    const q = searchParams.get("q");
    if (q) {
      setSearchQuery(q);
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 300);
    }
  }, [searchParams]);

  // Auto-avance del carrusel cada 5 segundos
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <main className="min-h-screen bg-[#F4F7F6] text-slate-900 pb-16">
      {/* Alerta si fue rebotado por RoleGuard */}
      {isUnauthorizedRedirect && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm flex items-start gap-3">
            <span className="text-xl">⚠️</span>
            <div className="space-y-1">
              <strong className="block font-semibold">
                Acceso Exclusivo para Freelancers
              </strong>
              <p>
                Para entrar al panel de freelancer debes tener activo el rol{" "}
                <strong>Freelancer</strong> en tu perfil.
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

      {/* ═══════════════════════════════════════════════
          HERO CARRUSEL — Diseño inspirado en diseno.png
          ═══════════════════════════════════════════════ */}
      <section className="px-3 sm:px-5 lg:px-8 pt-3 sm:pt-4">
        <div
          className="relative max-w-7xl mx-auto rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden shadow-sm"
          style={{ minHeight: "calc(100vh - 7rem)" }}
        >
          {/* ── Slides ── */}
          {heroSlides.map((slide, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                index === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0"
              }`}
              aria-hidden={index !== currentSlide}
            >
              {/* Background Image or Gradient fallback */}
              {slide.image ? (
                <img
                  src={slide.image}
                  alt={slide.title.replace("\n", " ")}
                  className="absolute inset-0 w-full h-full object-cover object-center"
                />
              ) : (
                <div className={`absolute inset-0 ${slide.gradient}`} />
              )}

              {/* Decorative glow blob */}
              <div
                className={`absolute top-1/4 right-1/4 w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] ${slide.accentGlow} blur-[100px] sm:blur-[140px] rounded-full pointer-events-none opacity-50`}
              />

              {/* Overlay oscuro para garantizar legibilidad perfecta del texto blanco */}
              <div className="absolute inset-0 bg-black/35 pointer-events-none" />
              <div className="absolute bottom-0 left-0 right-0 h-3/4 bg-gradient-to-t from-black/85 via-black/40 to-transparent pointer-events-none" />

              {/* ── Content — positioned bottom-left like diseno.png ── */}
              <div className="relative z-10 h-full flex flex-col justify-end p-6 sm:p-10 lg:p-14 xl:p-16 pb-14 sm:pb-16">
                <div className="max-w-2xl space-y-4 sm:space-y-5">
                  <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-white leading-[1.08] whitespace-pre-line tracking-tight font-futura drop-shadow-md">
                    {slide.title}
                  </h1>
                  <p className="text-sm sm:text-base lg:text-lg text-white/90 max-w-xl leading-relaxed drop-shadow-sm">
                    {slide.subtitle}
                  </p>
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => scrollToSection("categorias")}
                      className="inline-flex items-center gap-2 px-6 sm:px-7 py-3 sm:py-3.5 rounded-full border-2 border-white bg-white/10 backdrop-blur-sm text-white text-sm font-bold hover:bg-white hover:text-[#1F363D] transition-all duration-200 cursor-pointer active:scale-[0.97] shadow-lg"
                    >
                      Explorar Categorías
                    </button>
                  </div>
                </div>
              </div>

              {/* ── Floating card — right side, desktop only (Fiel a diseno.png: horizontal, sin bordes) ── */}
              <div className="hidden lg:block absolute right-8 xl:right-14 bottom-14 xl:bottom-16 z-20">
                <div className="bg-white rounded-3xl p-3.5 shadow-2xl flex items-center gap-3.5 max-w-xs xl:max-w-sm transform hover:scale-[1.02] transition-transform duration-300">
                  {slide.card.image ? (
                    <img
                      src={slide.card.image}
                      alt={slide.card.title}
                      className="w-20 h-20 xl:w-24 xl:h-24 rounded-2xl object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-20 h-20 xl:w-24 xl:h-24 rounded-2xl bg-slate-100 flex items-center justify-center text-3xl shrink-0">
                      {slide.card.icon}
                    </div>
                  )}
                  <div className="space-y-1 min-w-0 pr-2">
                    <h3 className="font-bold text-sm text-slate-900 truncate">
                      {slide.card.title}
                    </h3>
                    <p className="text-[11px] xl:text-xs text-slate-500 leading-snug line-clamp-2">
                      {slide.card.desc}
                    </p>
                    <span className="inline-block text-xs font-bold text-[#40798C] pt-0.5">
                      {slide.card.highlight}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* ── Dots navigation ── */}
          <div className="absolute bottom-5 sm:bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
            {heroSlides.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setCurrentSlide(index)}
                className={`rounded-full transition-all duration-300 cursor-pointer ${
                  index === currentSlide
                    ? "w-3 h-3 bg-white shadow-sm"
                    : "w-2.5 h-2.5 bg-white/40 hover:bg-white/60"
                }`}
                aria-label={`Slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════
          Categorías Rápidas
          ═══════════════════════════ */}
      <section
        id="categorias"
        className="scroll-mt-20 max-w-7xl mx-auto px-4 sm:px-6 py-12"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              Explora por Categoría
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Servicios organizados por especialidad con profesionales
              verificados
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
                className="group flex flex-col items-center p-4 rounded-xl border border-slate-200 bg-white hover:border-[#40798C]/40 hover:shadow-md transition-all text-center"
              >
                <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                  {cat.icon || "💼"}
                </span>
                <h3 className="font-semibold text-xs sm:text-sm text-slate-800 group-hover:text-[#40798C] transition-colors">
                  {cat.name}
                </h3>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ═══════════════════════════════════════
          Servicios Destacados / Resultados
          ═══════════════════════════════════════ */}
      <section
        ref={resultsRef}
        id="servicios"
        className="scroll-mt-20 max-w-7xl mx-auto px-4 sm:px-6 py-8"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                {searchQuery
                  ? `Resultados para "${searchQuery}"`
                  : "Servicios Destacados"}
              </h2>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-xs text-slate-400 hover:text-slate-700 underline cursor-pointer"
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
              <Button size="sm">+ Publicar servicio</Button>
            </Link>
          )}
        </div>

        {servicesLoading ? (
          <div className="flex min-h-[30vh] items-center justify-center text-sm text-slate-500">
            <span className="w-5 h-5 border-2 border-[#40798C] border-t-transparent rounded-full animate-spin mr-2" />
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
                {searchQuery
                  ? "No hay resultados para esta búsqueda"
                  : "Aún no hay servicios publicados"}
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
                    <Button size="sm">Registrarme como Freelancer</Button>
                  </Link>
                )}
              </div>
            )}
          </div>
        )}
      </section>

      {/* ════════════════════════════════════════
          PIE DE PÁGINA (FOOTER AESTHETIC) — Nosotros
          ════════════════════════════════════════ */}
      <footer id="nosotros" className="scroll-mt-20 px-3 sm:px-5 lg:px-8 pt-10 pb-6">
        <div className="relative max-w-7xl mx-auto rounded-[2rem] sm:rounded-[2.5rem] bg-[#1F363D] text-white overflow-hidden shadow-xl">
          {/* Glow ambiental decorativo */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#40798C]/20 blur-[130px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#70A9A1]/15 blur-[120px] rounded-full pointer-events-none" />

          <div className="relative z-10 p-8 sm:p-12 lg:p-16 space-y-12">
            {/* Fila Superior: Marca + Caja de Acción Rápida */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 pb-10 border-b border-white/10">
              <div className="space-y-3.5 max-w-lg">
                <Link
                  to="/"
                  className="font-futura font-extrabold text-3xl sm:text-4xl text-white tracking-tight hover:opacity-90 transition-opacity inline-block"
                >
                  WorkIn
                </Link>
                <p className="text-sm text-slate-300/85 leading-relaxed">
                  Conectamos clientes con el mejor talento independiente de forma transparente, protegiendo cada pago mediante nuestro sistema de garantía en custodia.
                </p>

                {/* Badges de Garantía y Confianza */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-white/10 text-[#CFE0C3] border border-white/10">
                    🔒 Fondos en Custodia Escrow
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-white/10 text-slate-200 border border-white/10">
                    ⚡ Entregas Garantizadas
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-white/10 text-slate-200 border border-white/10">
                    🛡️ Soporte & Mediación Activa
                  </span>
                </div>
              </div>

              {/* Caja de Acción Rápida / Banner de Invitación */}
              <div className="w-full lg:w-auto p-5 sm:p-6 rounded-2xl bg-white/[0.06] border border-white/10 backdrop-blur-sm space-y-3 shrink-0">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>✨</span> ¿Listo para dar el siguiente paso?
                </h4>
                <p className="text-xs text-slate-300 max-w-sm leading-relaxed">
                  Contrata a un profesional calificado para tu negocio o empieza a generar ingresos con tus habilidades.
                </p>
                <div className="flex items-center gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => scrollToSection("categorias")}
                    className="px-4 py-2 rounded-full bg-white text-[#1F363D] text-xs font-bold hover:bg-[#CFE0C3] transition-colors cursor-pointer"
                  >
                    Explorar Servicios
                  </button>
                  <Link
                    to="/register/freelancer"
                    className="px-4 py-2 rounded-full border border-white/30 text-white text-xs font-semibold hover:bg-white/10 transition-colors"
                  >
                    Ser Freelancer
                  </Link>
                </div>
              </div>
            </div>

            {/* Columnas de Navegación */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10">
              {/* Columna 1: Especialidades */}
              <div className="space-y-3">
                <h5 className="text-xs font-bold uppercase tracking-wider text-[#CFE0C3]">
                  Categorías
                </h5>
                <ul className="space-y-2 text-xs text-slate-300">
                  {categories.slice(0, 5).map((cat) => (
                    <li key={cat.id}>
                      <Link
                        to={`/categories/${cat.slug}`}
                        className="hover:text-white transition-colors flex items-center gap-1.5"
                      >
                        <span>{cat.icon || "•"}</span>
                        <span>{cat.name}</span>
                      </Link>
                    </li>
                  ))}
                  {categories.length === 0 && (
                    <>
                      <li><a href="#categorias" className="hover:text-white transition-colors">Diseño & Creatividad</a></li>
                      <li><a href="#categorias" className="hover:text-white transition-colors">Desarrollo Web</a></li>
                      <li><a href="#categorias" className="hover:text-white transition-colors">Marketing Digital</a></li>
                      <li><a href="#categorias" className="hover:text-white transition-colors">Consultoría</a></li>
                    </>
                  )}
                </ul>
              </div>

              {/* Columna 2: Freelancers */}
              <div className="space-y-3">
                <h5 className="text-xs font-bold uppercase tracking-wider text-[#CFE0C3]">
                  Freelancers
                </h5>
                <ul className="space-y-2 text-xs text-slate-300">
                  <li>
                    <Link to="/register/freelancer" className="hover:text-white transition-colors">
                      Crear perfil profesional
                    </Link>
                  </li>
                  <li>
                    <Link to={user ? "/services/new" : "/login"} className="hover:text-white transition-colors">
                      Publicar nuevo servicio
                    </Link>
                  </li>
                  <li>
                    <Link to={user ? "/freelancer/dashboard" : "/login"} className="hover:text-white transition-colors">
                      Panel de Freelancer
                    </Link>
                  </li>
                  <li>
                    <a href="#nosotros" className="hover:text-white transition-colors">
                      Cobros garantizados
                    </a>
                  </li>
                </ul>
              </div>

              {/* Columna 3: Clientes */}
              <div className="space-y-3">
                <h5 className="text-xs font-bold uppercase tracking-wider text-[#CFE0C3]">
                  Clientes
                </h5>
                <ul className="space-y-2 text-xs text-slate-300">
                  <li>
                    <button
                      type="button"
                      onClick={() => scrollToSection("servicios")}
                      className="hover:text-white transition-colors text-left cursor-pointer"
                    >
                      Buscar talento verificado
                    </button>
                  </li>
                  <li>
                    <Link to={user ? "/client/dashboard" : "/register"} className="hover:text-white transition-colors">
                      Panel de Contrataciones
                    </Link>
                  </li>
                  <li>
                    <Link to={user ? "/messages" : "/login"} className="hover:text-white transition-colors">
                      Chat & Mensajería en vivo
                    </Link>
                  </li>
                  <li>
                    <Link to={user ? "/orders" : "/login"} className="hover:text-white transition-colors">
                      Mis Pedidos
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Columna 4: Sobre Nosotros */}
              <div className="space-y-3">
                <h5 className="text-xs font-bold uppercase tracking-wider text-[#CFE0C3]">
                  Nosotros
                </h5>
                <p className="text-xs text-slate-300/80 leading-relaxed">
                  WorkIn es una plataforma creada para empoderar la economía freelance con acuerdos justos, requerimientos medibles y mediación profesional en cada entrega.
                </p>
                <div className="pt-2 flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[11px] font-medium text-emerald-300">
                    Sistema Operativo 24/7
                  </span>
                </div>
              </div>
            </div>

            {/* Barra Inferior de Copyright y Enlaces Legales */}
            <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
              <p>© {new Date().getFullYear()} WorkIn. Todos los derechos reservados.</p>
              <div className="flex items-center gap-6 text-[11px]">
                <span className="hover:text-white transition-colors cursor-default">Términos de Uso</span>
                <span className="hover:text-white transition-colors cursor-default">Privacidad</span>
                <span className="hover:text-white transition-colors cursor-default">Seguridad y Pagos</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
