import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../shared/context/AuthContext";
import { useCategories } from "../../hooks/useCategories";
import { Card, Input, Button } from "@freelance/ui";

export default function ClientRegisterForm() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [interestedCategory, setInterestedCategory] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { register, updateProfileData } = useAuth();
  const { categories, loading: categoriesLoading } = useCategories();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);

    try {
      const { error } = await register(email, password, fullName, "cliente");
      if (error) {
        setErrorMsg(error);
        setSubmitting(false);
        return;
      }

      // Si se ingresó teléfono, guardarlo en el perfil
      if (phone.trim()) {
        await updateProfileData({ phone: phone.trim() });
      }

      navigate("/client/dashboard");
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Error al registrar la cuenta");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-slate-50">
      <Card className="w-full max-w-lg shadow-md">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <Link
            to="/register"
            className="text-xs font-semibold text-slate-500 hover:text-primary transition-colors flex items-center gap-1"
          >
            ← Cambiar de rol
          </Link>
          <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">
            Registro: Cliente
          </span>
        </div>

        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-900">
            Crear Cuenta de Cliente
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Encuentra y contrata a los mejores freelancers con pago protegido en custodia.
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
            placeholder="Ej: Laura Martínez"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            autoComplete="name"
          />

          <Input
            label="Correo electrónico"
            type="email"
            placeholder="tu@empresa.com o personal"
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

          <Input
            label="Teléfono de contacto (opcional)"
            type="tel"
            placeholder="+54 9 11 1234-5678"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            helperText="Útil para coordinaciones y notificaciones de entregas."
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              ¿Qué tipo de servicios buscas contratar? (opcional)
            </label>
            <select
              value={interestedCategory}
              onChange={(e) => setInterestedCategory(e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Selecciona una categoría de interés...</option>
              {categoriesLoading ? (
                <option disabled>Cargando categorías...</option>
              ) : (
                categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon ? `${cat.icon} ` : ""}{cat.name}
                  </option>
                ))
              )}
            </select>
          </div>

          <Button
            type="submit"
            className="w-full mt-2"
            disabled={submitting}
          >
            {submitting ? "Creando tu cuenta de Cliente..." : "Registrarme como Cliente"}
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
