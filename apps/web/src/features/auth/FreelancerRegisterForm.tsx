import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../shared/context/AuthContext";
import { Card, Input, Button } from "@freelance/ui";
import { SkillsTags } from "../profile/SkillsTags";

export default function FreelancerRegisterForm() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState<string[]>([]);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { register, updateProfileData } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);

    try {
      // 1. Crear cuenta con rol exclusivo freelancer
      const { error } = await register(email, password, fullName, "freelancer");
      if (error) {
        setErrorMsg(error);
        setSubmitting(false);
        return;
      }

      // 2. Guardar datos extendidos del perfil profesional
      await updateProfileData({
        phone: phone.trim() || undefined,
        headline: headline.trim() || undefined,
        bio: bio.trim() || undefined,
        skills: skills.length > 0 ? skills : undefined,
      });

      // 3. Redirigir al panel de freelancer
      navigate("/freelancer/dashboard");
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Error al registrar la cuenta");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-slate-50">
      <Card className="w-full max-w-2xl shadow-md my-6">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <Link
            to="/register"
            className="text-xs font-semibold text-slate-500 hover:text-primary transition-colors flex items-center gap-1"
          >
            ← Cambiar de rol
          </Link>
          <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">
            Registro: Freelancer
          </span>
        </div>

        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-900">
            Crear Perfil de Freelancer
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Configura tu cuenta y perfil profesional para empezar a recibir ofertas con custodia segura en Escrow.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Bloque 1: Credenciales y Datos Personales */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider text-xs pb-1 border-b border-slate-100">
              1. Datos de Cuenta
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <Input
                label="Nombre completo"
                type="text"
                placeholder="Ej: Martín Rodríguez"
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

              <Input
                label="Teléfono de contacto (opcional)"
                type="tel"
                placeholder="+54 9 11 9876-5432"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          {/* Bloque 2: Perfil Profesional */}
          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider text-xs pb-1 border-b border-slate-100">
              2. Perfil Profesional
            </h3>

            <div>
              <Input
                label="Especialidad o Título Profesional"
                type="text"
                placeholder="Ej: Desarrollador Frontend React & UI/UX"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Biografía y Presentación
              </label>
              <textarea
                rows={3}
                placeholder="Cuéntale a tus futuros clientes tu experiencia, qué tecnologías dominas y qué tipo de trabajos realizas..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Habilidades y Tecnologías
              </label>
              <SkillsTags skills={skills} onChange={setSkills} />
            </div>
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full mt-4"
            disabled={submitting}
          >
            {submitting ? "Creando tu cuenta de Freelancer..." : "Registrarme como Freelancer"}
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
