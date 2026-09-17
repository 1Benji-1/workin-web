import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../shared/context/AuthContext";
import { Card, Input, Button } from "@freelance/ui";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || "/profile";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);

    const { error } = await login(email, password);
    setSubmitting(false);

    if (error) {
      setErrorMsg(error);
    } else {
      navigate(from, { replace: true });
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-slate-50">
      <Card className="w-full max-w-md shadow-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-primary">Iniciar Sesión</h1>
          <p className="text-sm text-slate-500 mt-1">
            Ingresa a tu cuenta de WorkIn
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Correo electrónico"
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-slate-700">
                Contraseña
              </label>
              <Link
                to="/forgot-password"
                className="text-xs text-slate-500 hover:text-primary transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <Button
            type="submit"
            className="w-full mt-2"
            disabled={submitting}
          >
            {submitting ? "Ingresando..." : "Entrar a mi cuenta"}
          </Button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-600">
          ¿Aún no tienes cuenta?{" "}
          <Link to="/register" className="font-semibold text-primary hover:underline">
            Regístrate aquí
          </Link>
        </div>
      </Card>
    </div>
  );
}
