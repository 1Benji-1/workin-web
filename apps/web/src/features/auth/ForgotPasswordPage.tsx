import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../shared/context/AuthContext";
import { Card, Input, Button } from "@freelance/ui";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);

    const { error } = await resetPassword(email);
    setSubmitting(false);

    if (error) {
      setErrorMsg(error);
    } else {
      setSubmitted(true);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-slate-50">
      <Card className="w-full max-w-md shadow-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-primary">Recuperar Contraseña</h1>
          <p className="text-sm text-slate-500 mt-1">
            Te enviaremos un enlace para restablecerla
          </p>
        </div>

        {submitted ? (
          <div className="space-y-4 text-center">
            <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-sm text-green-800">
              ¡Correo enviado! Revisa tu bandeja de entrada en <strong>{email}</strong> y sigue las instrucciones para cambiar tu contraseña.
            </div>
            <Link to="/login">
              <Button variant="outline" className="w-full mt-2">
                Volver al inicio de sesión
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                {errorMsg}
              </div>
            )}

            <Input
              label="Correo electrónico de tu cuenta"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />

            <Button
              type="submit"
              className="w-full mt-2"
              disabled={submitting}
            >
              {submitting ? "Enviando..." : "Enviar enlace de recuperación"}
            </Button>

            <div className="text-center pt-2">
              <Link to="/login" className="text-xs text-slate-600 hover:text-primary transition-colors">
                ← Volver al inicio de sesión
              </Link>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
