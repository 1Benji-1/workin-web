import React from "react";
import { Link, useNavigate } from "react-router-dom";

export default function RoleSelectionPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-slate-50">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Únete a <span className="text-primary">WorkIn</span>
          </h1>
          <p className="text-sm text-slate-600 mt-2 max-w-md mx-auto">
            Selecciona cómo deseas participar en la plataforma. Podrás acceder a herramientas exclusivas diseñadas para tu rol.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-5 mb-8">
          {/* Opción Cliente */}
          <button
            type="button"
            onClick={() => navigate("/register/cliente")}
            className="group text-left rounded-2xl bg-white border-2 border-slate-200 p-6 shadow-sm hover:border-primary hover:shadow-md transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary/20 flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-2xl mb-4 group-hover:bg-primary group-hover:text-white transition-colors">
                💼
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 group-hover:text-primary">
                Rol: Cliente
              </span>
              <h2 className="text-xl font-bold text-slate-900 mt-1">
                Quiero contratar servicios
              </h2>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Publica acuerdos, contrata talento calificado y paga de forma segura mediante custodia protegida en Escrow.
              </p>

              <ul className="mt-4 space-y-2 text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span>Pago retenido en custodia hasta tu aprobación</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span>Garantía de mediación en caso de discrepancias</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span>Explora categorías y perfiles verificados</span>
                </li>
              </ul>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-primary group-hover:translate-x-1 transition-transform">
              <span>Continuar como Cliente</span>
              <span>→</span>
            </div>
          </button>

          {/* Opción Freelancer */}
          <button
            type="button"
            onClick={() => navigate("/register/freelancer")}
            className="group text-left rounded-2xl bg-white border-2 border-slate-200 p-6 shadow-sm hover:border-accent hover:shadow-md transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-accent/20 flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl mb-4 group-hover:bg-accent group-hover:text-slate-900 transition-colors">
                🚀
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 group-hover:text-emerald-700">
                Rol: Freelancer
              </span>
              <h2 className="text-xl font-bold text-slate-900 mt-1">
                Quiero ofrecer servicios
              </h2>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Ofrece tus servicios, trabaja con clientes verificados y recibe pagos garantizados con mediación transparente.
              </p>

              <ul className="mt-4 space-y-2 text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span>Cobro 100% asegurado antes de empezar a trabajar</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span>Panel exclusivo para gestionar tus servicios y pedidos</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span>Construye reputación y portafolio profesional</span>
                </li>
              </ul>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-emerald-600 group-hover:translate-x-1 transition-transform">
              <span>Continuar como Freelancer</span>
              <span>→</span>
            </div>
          </button>
        </div>

        <div className="text-center text-xs text-slate-600">
          ¿Ya tienes una cuenta registrada?{" "}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Inicia sesión aquí
          </Link>
        </div>
      </div>
    </div>
  );
}
