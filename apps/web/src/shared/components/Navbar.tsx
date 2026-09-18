import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCategories } from "../../hooks/useCategories";
import { Button } from "@freelance/ui";

export function Navbar() {
  const { user, roles, primaryRole } = useAuth();
  const { categories } = useCategories();
  const location = useLocation();
  const isHome = location.pathname === "/";

  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const dashboardUrl =
    primaryRole === "freelancer" || roles.includes("freelancer")
      ? "/freelancer/dashboard"
      : "/client/dashboard";

  // Cerrar menús al cambiar de ruta
  useEffect(() => {
    setCategoriesOpen(false);
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Cerrar dropdown de categorías al hacer clic afuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setCategoriesOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Rutas que ya cuentan con DashboardLayout o AdminLayout (tienen su propio sidebar y header)
  const isDashboardRoute =
    location.pathname.startsWith("/client/dashboard") ||
    location.pathname.startsWith("/freelancer/dashboard") ||
    location.pathname.startsWith("/orders") ||
    location.pathname.startsWith("/messages") ||
    location.pathname.startsWith("/notifications") ||
    location.pathname.startsWith("/profile") ||
    location.pathname.startsWith("/admin");

  if (isDashboardRoute) {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md shadow-2xs">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Logo & Dropdown de Categorías */}
        <div className="flex items-center gap-6 md:gap-8">
          <Link to="/" className="font-futura font-extrabold text-2xl text-[#1F363D] tracking-tight hover:opacity-90 transition-opacity">
            WorkIn
          </Link>

          <nav className="hidden md:flex items-center">
            {/* Dropdown de Categorías */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setCategoriesOpen(!categoriesOpen)}
                className={`flex items-center gap-1.5 text-sm font-medium text-slate-600 transition-colors ${
                  categoriesOpen ? "text-primary font-semibold" : "hover:text-primary"
                }`}
                aria-expanded={categoriesOpen}
              >
                <span>Categorías</span>
                <svg
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                    categoriesOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {categoriesOpen && (
                <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-1.5 border-b border-slate-100 mb-1">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Explorar Categorías
                    </span>
                  </div>
                  {categories.length > 0 ? (
                    categories.map((cat) => (
                      <Link
                        key={cat.id}
                        to={`/categories/${cat.slug}`}
                        className="flex items-center gap-3 px-3.5 py-2.5 hover:bg-slate-50 transition-colors text-slate-700 hover:text-primary text-sm group"
                        onClick={() => setCategoriesOpen(false)}
                      >
                        <span className="text-lg w-6 text-center">{cat.icon || "💼"}</span>
                        <div>
                          <p className="font-medium text-xs leading-none group-hover:text-primary">
                            {cat.name}
                          </p>
                          <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                            {cat.description}
                          </p>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 px-4 py-2">Cargando categorías...</p>
                  )}
                </div>
              )}
            </div>
          </nav>
        </div>

        {/* Zona derecha: Sesión / Dashboard */}
        <div className="flex items-center gap-3">
          {user ? (
            isHome && (
              <Link to={dashboardUrl}>
                <Button size="sm" variant="primary" className="text-xs py-1.5 px-4 font-semibold">
                  Dashboard
                </Button>
              </Link>
            )
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button variant="outline" size="sm" className="text-xs py-1.5 px-3 font-medium">
                  Iniciar sesión
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="primary" size="sm" className="text-xs py-1.5 px-3 font-semibold">
                  Registrarse
                </Button>
              </Link>
            </div>
          )}

          {/* Botón menú mobile */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-500 hover:text-slate-800"
            aria-label="Abrir menú"
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

      {/* Menú Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-4">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Categorías
            </span>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((c) => (
                <Link
                  key={c.id}
                  to={`/categories/${c.slug}`}
                  className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 text-xs text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <span>{c.icon}</span>
                  <span className="truncate font-medium">{c.name}</span>
                </Link>
              ))}
            </div>
          </div>

          {user ? (
            isHome && (
              <div className="pt-2 border-t border-slate-100">
                <Link to={dashboardUrl} className="block">
                  <Button size="sm" className="w-full text-xs py-2">
                    Ir al Dashboard
                  </Button>
                </Link>
              </div>
            )
          ) : (
            <div className="pt-2 border-t border-slate-100">
              <div className="flex flex-col gap-2">
                <Link to="/login" className="block">
                  <Button variant="outline" size="sm" className="w-full text-xs py-2">
                    Iniciar sesión
                  </Button>
                </Link>
                <Link to="/register" className="block">
                  <Button size="sm" className="w-full text-xs py-2">
                    Registrarse
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
