import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface DashboardLayoutProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export function DashboardLayout({
  title = "Dashboard",
  subtitle,
  children,
  actions,
}: DashboardLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, roles, primaryRole, logout } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const isFreelancer = primaryRole === "freelancer" || roles.includes("freelancer");
  const isAdminOrSupport = roles.includes("admin") || roles.includes("soporte");

  const navigationItems = [
    {
      label: "Overview",
      path: isFreelancer ? "/freelancer/dashboard" : "/client/dashboard",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
      exact: true,
    },
    {
      label: "Pedidos & Contratos",
      path: "/orders",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      exact: false,
    },
    {
      label: "Mensajes",
      path: "/messages",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      exact: false,
    },
    {
      label: "Notificaciones",
      path: "/notifications",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      ),
      exact: false,
    },
    {
      label: "Mi Perfil & Ajustes",
      path: "/profile",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      exact: false,
    },
    ...(isAdminOrSupport
      ? [
          {
            label: "Backoffice Admin",
            path: "/admin",
            icon: (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            ),
            exact: false,
          },
        ]
      : []),
  ];

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7F6] flex w-full relative">
      {/* 1. SIDEBAR LATERAL (Estilo NexaVerse de diseno.png) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#1F363D] text-white flex flex-col justify-between transition-transform duration-300 lg:translate-x-0 ${
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div>
          {/* Logo & Marca + Botón Cerrar en móvil */}
          <div className="h-16 sm:h-20 flex items-center justify-between px-6 border-b border-white/10">
            <Link
              to="/"
              onClick={() => setMobileSidebarOpen(false)}
              className="font-futura font-extrabold text-2xl tracking-tight text-white hover:opacity-90 transition-opacity"
            >
              WorkIn
            </Link>
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(false)}
              className="p-1.5 -mr-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 lg:hidden"
              aria-label="Cerrar menú"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Menú de Navegación */}
          <nav className="p-4 space-y-1.5">
            {navigationItems.map((item) => {
              const isActive = item.exact
                ? location.pathname === item.path
                : location.pathname.startsWith(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileSidebarOpen(false)}
                  className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-white/15 text-white font-semibold shadow-inner"
                      : "text-slate-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span className={isActive ? "text-[#CFE0C3]" : "text-slate-400"}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </Link>
              );
            })}

            <div className="pt-4 mt-4 border-t border-white/10">
              <Link
                to="/"
                onClick={() => setMobileSidebarOpen(false)}
                className="flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium text-slate-300 hover:bg-white/5 hover:text-white transition-all"
              >
                <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span>Marketplace</span>
              </Link>
            </div>
          </nav>
        </div>

        {/* Footer del Sidebar: Botón Log out estilo diseno.png */}
        <div className="p-4 border-t border-white/10">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium text-slate-300 hover:bg-rose-500/20 hover:text-rose-200 transition-all text-left cursor-pointer"
          >
            <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {/* Backdrop móvil para el sidebar */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* 2. ÁREA PRINCIPAL CON HEADER SUPERIOR */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0 w-full">
        {/* Header Superior estilo diseno.png */}
        <header className="sticky top-0 z-30 h-16 sm:h-20 bg-[#F4F7F6]/90 backdrop-blur-md px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3 sm:gap-4 border-b border-slate-200/60">
          {/* Título & Botón móvil */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="p-2 -ml-1 text-slate-600 hover:text-[#1F363D] lg:hidden rounded-lg hover:bg-slate-200/50 flex-shrink-0 cursor-pointer"
              aria-label="Abrir menú"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl font-extrabold text-[#1F363D] tracking-tight truncate">
                {title}
              </h1>
              {subtitle && (
                <p className="text-xs text-slate-500 hidden md:block mt-0.5 truncate max-w-sm lg:max-w-md xl:max-w-xl">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Buscador píldora oscura + Chip de Usuario */}
          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            {/* Search Pill (diseno.png) - visible en pantallas grandes */}
            <form onSubmit={handleSearchSubmit} className="hidden xl:block relative">
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-slate-400 text-sm pointer-events-none">
                  🔍
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar en WorkIn..."
                  className="w-48 2xl:w-72 rounded-full bg-[#1F363D] text-white text-xs pl-9 pr-4 py-2 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#70A9A1] transition-all"
                />
              </div>
            </form>

            {/* Chip de Usuario con avatar */}
            <Link
              to="/profile"
              className="flex items-center gap-2 p-1 sm:p-1.5 pr-2.5 sm:pr-3 rounded-full bg-white border border-slate-200 shadow-2xs hover:border-[#40798C] transition-colors"
            >
              {profile?.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.fullName || "User"}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#40798C] text-white flex items-center justify-center font-bold text-xs">
                  {(profile?.fullName || user?.email || "U")[0].toUpperCase()}
                </div>
              )}
              <div className="hidden sm:block text-left">
                <span className="text-xs font-semibold text-[#1F363D] block leading-tight max-w-[90px] lg:max-w-[120px] truncate">
                  {profile?.fullName || "Mi Cuenta"}
                </span>
                <span className="text-[10px] text-[#40798C] block leading-tight capitalize">
                  {primaryRole || "usuario"}
                </span>
              </div>
              <svg className="w-3.5 h-3.5 text-slate-400 hidden sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </Link>
          </div>
        </header>

        {/* 3. CONTENIDO DE LA PÁGINA */}
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-5 sm:space-y-6 min-w-0">
          {actions && (
            <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 w-full">
              {actions}
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
