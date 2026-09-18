import React, { useEffect, useState } from "react";
import { useAuth } from "../../shared/context/AuthContext";
import { Card, Button, Badge } from "@freelance/ui";
import { DashboardLayout } from "../../shared/components/DashboardLayout";
import { ProfileForm, type ProfileFormData } from "./ProfileForm";
import { useReviews } from "../../hooks/useReviews";
import { RatingSummaryCard, ReviewsList } from "../reviews";

export default function ProfilePage() {
  const { user, profile, roles, updateProfileData, toggleRole, isLoading } = useAuth();
  const isFreelancer = roles.includes("freelancer");

  const {
    reviews,
    summary,
    loading: reviewsLoading,
    handleReplyAdded,
  } = useReviews({
    freelancerId: isFreelancer && user ? user.id : undefined,
    autoFetch: isFreelancer && Boolean(user),
  });

  const [formData, setFormData] = useState<ProfileFormData>({
    fullName: "",
    phone: "",
    phoneVerified: false,
    avatarUrl: "",
    headline: "",
    bio: "",
    hourlyRate: "",
    skills: [],
    portfolio: [],
  });

  const [saving, setSaving] = useState(false);
  const [roleUpdating, setRoleUpdating] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (profile) {
      setFormData({
        fullName: profile.fullName || "",
        phone: profile.phone || "",
        phoneVerified: profile.phoneVerified || false,
        avatarUrl: profile.avatarUrl || "",
        headline: profile.headline || "",
        bio: profile.bio || "",
        hourlyRate: profile.hourlyRate ? String(profile.hourlyRate) : "",
        skills: profile.skills || [],
        portfolio: profile.portfolio || [],
      });
    }
  }, [profile]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-slate-500">
        Cargando perfil...
      </div>
    );
  }

  const handleFormDataChange = (updates: Partial<ProfileFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    const { error } = await updateProfileData({
      fullName: formData.fullName,
      phone: formData.phone,
      phoneVerified: formData.phoneVerified,
      avatarUrl: formData.avatarUrl,
      headline: formData.headline,
      bio: formData.bio,
      hourlyRate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : null,
      skills: formData.skills,
      portfolio: formData.portfolio,
    });

    setSaving(false);
    if (error) {
      setFeedback({ type: "error", text: error });
    } else {
      setFeedback({ type: "success", text: "¡Perfil guardado correctamente!" });
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const handleToggleFreelancerRole = async () => {
    setRoleUpdating(true);
    setFeedback(null);

    const nextState = !isFreelancer;
    const { error } = await toggleRole("freelancer", nextState);
    setRoleUpdating(false);

    if (error) {
      setFeedback({ type: "error", text: `Error al cambiar rol: ${error}` });
    } else {
      setFeedback({
        type: "success",
        text: nextState
          ? "¡Rol de Freelancer activado! Ahora puedes configurar tus servicios y acceder al panel."
          : "Rol de Freelancer desactivado temporalmente.",
      });
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  return (
    <DashboardLayout
      title="Mi Perfil & Ajustes"
      subtitle="Configura tus datos personales, de contacto y tu perfil profesional para el marketplace."
    >
      <div className="space-y-6">
        {feedback && (
          <div
            className={`p-4 rounded-xl text-sm font-medium border ${
              feedback.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-rose-50 text-rose-700 border-rose-200"
            }`}
          >
            {feedback.text}
          </div>
        )}

        {/* Banner de Estado de Roles - Estilizado con paleta NexaVerse */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-[#40798C]">
                Tipo de Cuenta
              </span>
              <Badge variant={isFreelancer ? "accent" : "neutral"} size="sm">
                {isFreelancer ? "✓ Freelancer & Cliente" : "Cliente"}
              </Badge>
            </div>
            <h2 className="text-lg font-bold text-[#1F363D]">
              {isFreelancer ? "Cuenta con Perfil Freelancer Activo" : "Cuenta en Modo Cliente"}
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-lg">
              {isFreelancer
                ? "Tienes habilitado el panel de trabajo para publicar servicios, recibir solicitudes de contratación y generar ingresos."
                : "Actualmente puedes buscar, contratar y pagar servicios. Si deseas ofrecer tus habilidades y trabajar, activa tu rol de freelancer."}
            </p>
          </div>

          <Button
            variant={isFreelancer ? "outline" : "primary"}
            size="sm"
            onClick={handleToggleFreelancerRole}
            disabled={roleUpdating}
            className="self-start sm:self-center shrink-0 font-bold"
          >
            {roleUpdating
              ? "Actualizando..."
              : isFreelancer
              ? "Desactivar modo Freelancer"
              : "🚀 Activar como Freelancer"}
          </Button>
        </div>

        {/* Formulario Modular de Perfil */}
        <ProfileForm
          data={formData}
          email={user?.email}
          isFreelancer={isFreelancer}
          saving={saving}
          onChange={handleFormDataChange}
          onSubmit={handleSaveProfile}
        />

        {/* Sección de Reputación y Reseñas para Freelancers */}
        {isFreelancer && (
          <div className="space-y-6 pt-6 border-t border-slate-200/80">
            <div>
              <h2 className="text-lg font-bold text-[#1F363D]">
                Reputación y Calificaciones Recibidas
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Testimonios reales y puntuaciones acumuladas en tus trabajos completados en WorkIn.
              </p>
            </div>

            <RatingSummaryCard
              summary={summary}
              title="Resumen de tu Reputación Profesional"
            />

            <div className="space-y-3">
              <h3 className="text-base font-bold text-[#1F363D] flex items-center gap-2">
                <span>💬</span> Reseñas de Clientes ({summary.count})
              </h3>
              <ReviewsList
                reviews={reviews}
                loading={reviewsLoading}
                currentUserId={user?.id}
                onReplySuccess={handleReplyAdded}
                emptyMessage="Aún no has recibido reseñas. Completa órdenes para construir tu historial y reputación profesional."
              />
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
