import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../shared/context/AuthContext";
import type { Role } from "@freelance/types";
import { Card, Input, Button } from "@freelance/ui";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isClient, setIsClient] = useState(true);
  const [isFreelancer, setIsFreelancer] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!isClient && !isFreelancer) {
      setErrorMsg("Debes seleccionar al menos un rol (Cliente o Freelancer).");
      return;
    }

    setSubmitting(true);

    const initialRoles: Role[] = [];
    if (isClient) initialRoles.push("cliente");
    if (isFreelancer) initialRoles.push("freelancer");

    const { error } = await register(email, password, fullName, initialRoles);
    setSubmitting(false);

    if (error) {
      setErrorMsg(error);
    } else {
      navigate("/profile");
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-slate-50">
      <Card className="w-full max-w-md shadow-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-primary">Crear Cuenta</h1>
          <p className="text-sm text-slate-500 mt-1">
            Únete a la plataforma freelance más segura
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nombre completo"
            type="text"
            placeholder="Ej: Isabel García"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            autoComplete="name"
          />

          <Input
            label="Correo electrónico"
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />

          <Input
            label="Contraseña"
            type="password"
            placeholder="Mínimo 6 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
          />

          {/* Selección de Roles */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="block text-sm font-medium text-slate-700">
              ¿Cómo deseas usar la plataforma?
            </label>
            <p className="text-xs text-slate-500">
              Puedes elegir ambos roles ahora o cambiarlo después desde tu perfil.
            </p>

            <div className="space-y-2 pt-1">
              <label className="flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={isClient}
                  onChange={(e) => setIsClient(e.target.checked)}
                  className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4"
                />
                <div className="text-xs">
                  <span className="font-semibold block text-slate-800">Contratar servicios (Cliente)</span>
                  <span className="text-slate-500">Busco contratar freelancers con pago seguro en escrow</span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={isFreelancer}
                  onChange={(e) => setIsFreelancer(e.target.checked)}
                  className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4"
                />
                <div className="text-xs">
                  <span className="font-semibold block text-slate-800">Ofrecer servicios (Freelancer)</span>
                  <span className="text-slate-500">Quiero publicar mis habilidades y recibir pagos protegidos</span>
                </div>
              </label>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full mt-2"
            disabled={submitting}
          >
            {submitting ? "Creando cuenta..." : "Crear mi cuenta"}
          </Button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-600">
          ¿Ya tienes cuenta?{" "}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Inicia sesión aquí
          </Link>
        </div>
      </Card>
    </div>
  );
}
