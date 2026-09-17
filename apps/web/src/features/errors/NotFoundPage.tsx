import React from "react";
import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center">
        <div className="relative mb-6">
          <span className="text-8xl font-black text-slate-200 select-none">404</span>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl">🔍</span>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-slate-800 mb-2">
          Página no encontrada
        </h1>

        <p className="text-slate-500 mb-8 text-sm leading-relaxed">
          La página que buscas no existe, ha sido movida o la dirección ingresada es incorrecta.
        </p>

        <div className="flex justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 text-sm"
          >
            ← Volver al Inicio
          </Link>
          <Link
            to="/categories/desarrollo-web"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors text-sm"
          >
            Explorar Servicios
          </Link>
        </div>
      </div>
    </div>
  );
}

export default NotFoundPage;
