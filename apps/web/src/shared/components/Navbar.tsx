import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "@freelance/ui";

export function Navbar() {
  const { user, roles, primaryRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchVal, setSearchVal] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const dashboardUrl =
    primaryRole === "freelancer" || roles.includes("freelancer")
      ? "/freelancer/dashboard"
      : "/client/dashboard";

  // Cerrar menú mobile al cambiar de ruta
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Ocultar en rutas con DashboardLayout / AdminLayout
  const isDashboardRoute =
    location.pathname.startsWith("/client/dashboard") ||
    location.pathname.startsWith("/freelancer/dashboard") ||
    location.pathname.startsWith("/orders") ||
    location.pathname.startsWith("/messages") ||
    location.pathname.startsWith("/notifications") ||
    location.pathname.startsWith("/profile") ||
    location.pathname.startsWith("/admin");

  if (isDashboardRoute) return null;

  const scrollToSection = (sectionId: string) => {
    setMobileMenuOpen(false);
    if (location.pathname !== "/") {
      navigate("/");
      setTimeout(() => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
      }, 300);
    } else {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchVal.trim();
    if (!q) return;
    setMobileMenuOpen(false);
    navigate(`/?q=${encodeURIComponent(q)}`);
    setTimeout(() => {
      document.getElementById("servicios")?.scrollIntoView({ behavior: "smooth" });
    }, 300);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo + Nav Links */}
        <div className="flex items-center gap-6 lg:gap-10">
          <Link
            to="/"
            className="font-futura font-extrabold text-[22px] text-[#1F363D] tracking-tight hover:opacity-90 transition-opacity"
          >
            WorkIn
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            <Link
              to="/"
              className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-[#1F363D] rounded-lg hover:bg-slate-50 transition-all"
            >
              Inicio
            </Link>
            <button
              type="button"
              onClick={() => scrollToSection("categorias")}
              className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-[#1F363D] rounded-lg hover:bg-slate-50 transition-all cursor-pointer"
            >
              Categorías
            </button>
            <Link
              to="/register/freelancer"
              className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-[#1F363D] rounded-lg hover:bg-slate-50 transition-all whitespace-nowrap"
            >
              Quiero ser Freelancer
            </Link>
            <button
              type="button"
              onClick={() => scrollToSection("nosotros")}
              className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-[#1F363D] rounded-lg hover:bg-slate-50 transition-all cursor-pointer whitespace-nowrap"
            >
              Nosotros
            </button>
          </nav>
        </div>

        {/* Search + Actions (Desktop) */}
        <div className="hidden lg:flex items-center gap-3">
          {/* Barra de búsqueda compacta */}
          <form onSubmit={handleSearchSubmit} className="flex items-center">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                placeholder="Search"
                className="w-40 lg:w-48 rounded-full border border-slate-200 bg-slate-50/80 py-2 pl-9 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-[#40798C] focus:outline-none focus:ring-2 focus:ring-[#40798C]/20 transition-all"
              />
            </div>
          </form>

          {/* Auth Buttons */}
          {user ? (
            <Link to={dashboardUrl}>
              <Button
                size="sm"
                variant="dark"
                className="text-xs py-1.5 px-4 font-semibold !rounded-full"
              >
                Dashboard
              </Button>
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs py-1.5 px-3.5 font-medium !rounded-full"
                >
                  Iniciar sesión
                </Button>
              </Link>
              <Link to="/register">
                <Button
                  variant="dark"
                  size="sm"
                  className="text-xs py-1.5 px-3.5 font-semibold !rounded-full"
                >
                  Registrarse
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex lg:hidden items-center">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Menú"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* ── Mobile Drawer ── */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-3">
          <nav className="flex flex-col gap-1">
            <Link
              to="/"
              className="px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Inicio
            </Link>
            <button
              type="button"
              onClick={() => scrollToSection("categorias")}
              className="px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors text-left cursor-pointer"
            >
              Categorías
            </button>
            <Link
              to="/register/freelancer"
              className="px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Quiero ser Freelancer
            </Link>
            <button
              type="button"
              onClick={() => scrollToSection("nosotros")}
              className="px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors text-left cursor-pointer"
            >
              Nosotros
            </button>
          </nav>

          {/* Mobile search */}
          <form
            onSubmit={handleSearchSubmit}
            className="pt-2 border-t border-slate-100"
          >
            <div className="relative">
              <svg
                className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                placeholder="Buscar servicios..."
                className="w-full rounded-full border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-[#40798C] focus:outline-none focus:ring-2 focus:ring-[#40798C]/20"
              />
            </div>
          </form>

          {/* Mobile auth */}
          <div className="pt-2 border-t border-slate-100">
            {user ? (
              <Link to={dashboardUrl} className="block" onClick={() => setMobileMenuOpen(false)}>
                <Button size="sm" variant="dark" className="w-full text-xs py-2 !rounded-full">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <div className="flex flex-col gap-2">
                <Link to="/login" className="block" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" size="sm" className="w-full text-xs py-2 !rounded-full">
                    Iniciar sesión
                  </Button>
                </Link>
                <Link to="/register" className="block" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="dark" size="sm" className="w-full text-xs py-2 !rounded-full">
                    Registrarse
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
