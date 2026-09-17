import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCategories } from "../../hooks/useCategories";
import { Badge, Button } from "@freelance/ui";
import { NotificationBell } from "../../features/notifications";

export function Navbar() {
  const { user, profile, roles, logout } = useAuth();
  const { categories } = useCategories();
  const navigate = useNavigate();
  const location = useLocation();

  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const isFreelancer = roles.includes("freelancer");
  const isSupportOrAdmin = roles.includes("admin") || roles.includes("soporte");

  // Close dropdown on route change or click outside
  useEffect(() => {
    setCategoriesOpen(false);
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setCategoriesOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Logo & Main Nav */}
        <div className="flex items-center gap-6 md:gap-8">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl text-primary tracking-tight">
            <span className="w-8 h-8 rounded-lg bg-primary text-accent flex items-center justify-center font-black text-lg shadow-sm">
              W
            </span>
            <span>WorkIn</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <Link to="/" className="hover:text-primary transition-colors">
              Inicio
            </Link>

            {/* Categorías Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setCategoriesOpen(!categoriesOpen)}
                className={`flex items-center gap-1.5 transition-colors ${
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

            {/* Panel Freelancer */}
            {user && (
              <Link
                to="/freelancer/dashboard"
                className={`flex items-center gap-1.5 transition-colors ${
                  isFreelancer ? "hover:text-primary text-slate-700" : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <span>Panel Freelancer</span>
                {!isFreelancer && (
                  <Badge variant="neutral" size="sm">
                    Inactivo
                  </Badge>
                )}
              </Link>
            )}

            {/* Mis Pedidos */}
            {user && (
              <Link
                to="/orders"
                className="hover:text-primary transition-colors"
              >
                Mis Pedidos
              </Link>
            )}

            {/* Disputas */}
            {user && (
              <Link
                to="/disputes"
                className="hover:text-primary transition-colors"
              >
                Disputas
              </Link>
            )}

            {/* Mensajes (Fase 7) */}
            {user && (
              <Link
                to="/messages"
                className="hover:text-primary transition-colors"
              >
                Mensajes
              </Link>
            )}

            {/* Backoffice / Soporte (Fase 9) */}
            {user && isSupportOrAdmin && (
              <Link
                to="/admin"
                className="flex items-center gap-1 text-red-600 hover:text-red-700 font-bold transition-colors bg-red-50 hover:bg-red-100/80 px-2.5 py-1 rounded-lg border border-red-200 text-xs shadow-xs"
              >
                <span>🛡️ Backoffice</span>
              </Link>
            )}
          </nav>
        </div>

        {/* User / Auth CTA */}
        <div className="flex items-center gap-3">
          {/* Publicar servicio CTA (solo para freelancers) */}
          {isFreelancer && (
            <Link to="/services/new" className="hidden sm:inline-flex">
              <Button size="sm" variant="outline" className="text-xs border-accent text-accent hover:bg-accent/10 font-semibold">
                + Publicar servicio
              </Button>
            </Link>
          )}

          {user ? (
            <div className="flex items-center gap-2.5 sm:gap-3">
              {/* Campanita de Notificaciones (Fase 8) */}
              <NotificationBell />

              {/* Badges de Roles */}
              <div className="hidden sm:flex items-center gap-1.5">
                {roles.includes("admin") && (
                  <Badge variant="danger" size="sm">
                    Admin
                  </Badge>
                )}
                {roles.includes("soporte") && (
                  <Badge variant="primary" size="sm">
                    Soporte
                  </Badge>
                )}
                {roles.includes("cliente") && !roles.includes("admin") && (
                  <Badge variant="neutral" size="sm">
                    Cliente
                  </Badge>
                )}
                {roles.includes("freelancer") && (
                  <Badge variant="accent" size="sm">
                    Freelancer
                  </Badge>
                )}
              </div>

              {/* Botón Mi Perfil */}
              <Link to="/profile">
                <Button variant="outline" className="text-xs py-1.5 px-3 bg-white text-slate-800 border-slate-200 hover:bg-slate-50">
                  {profile?.fullName || user.email?.split("@")[0] || "Mi Perfil"}
                </Button>
              </Link>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="text-xs font-medium text-slate-500 hover:text-red-600 transition-colors px-2 py-1"
              >
                Salir
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button className="text-xs py-1.5 px-3 bg-transparent text-slate-700 hover:bg-slate-100 shadow-none">
                  Iniciar sesión
                </Button>
              </Link>
              <Link to="/register">
                <Button className="text-xs py-1.5 px-3">
                  Registrarse
                </Button>
              </Link>
            </div>
          )}

          {/* Mobile hamburger button */}
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

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-3">
          <Link to="/" className="block text-sm font-medium text-slate-700 py-1">
            Inicio
          </Link>
          <div className="pt-2 border-t border-slate-100">
            <span className="text-xs font-semibold text-slate-400 uppercase">Categorías</span>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {categories.map((c) => (
                <Link
                  key={c.id}
                  to={`/categories/${c.slug}`}
                  className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 text-xs text-slate-700"
                >
                  <span>{c.icon}</span>
                  <span className="truncate">{c.name}</span>
                </Link>
              ))}
            </div>
          </div>
          {isFreelancer && (
            <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
              <Link to="/services/new">
                <Button size="sm" className="w-full">
                  + Publicar servicio
                </Button>
              </Link>
              <Link to="/freelancer/dashboard" className="block text-sm font-medium text-slate-700 py-1">
                Panel Freelancer
              </Link>
            </div>
          )}
          {user && (
            <>
              <Link to="/orders" className="block text-sm font-medium text-slate-700 py-1 border-t border-slate-100 pt-2">
                Mis Pedidos
              </Link>
              <Link to="/disputes" className="block text-sm font-medium text-slate-700 py-1">
                Disputas
              </Link>
              <Link to="/messages" className="block text-sm font-medium text-slate-700 py-1">
                Mensajes
              </Link>
              <Link to="/notifications" className="block text-sm font-medium text-slate-700 py-1">
                Notificaciones
              </Link>
              {isSupportOrAdmin && (
                <Link to="/admin" className="block text-sm font-bold text-red-600 py-1">
                  🛡️ Panel Backoffice / Soporte
                </Link>
              )}
            </>
          )}
        </div>
      )}
    </header>
  );
}
