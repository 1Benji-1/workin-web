import React, { useEffect, useState } from "react";
import { useAuth } from "../../shared/context/AuthContext";
import { Card, Button, Badge } from "@freelance/ui";
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
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-primary">Mi Perfil</h1>
          <p className="text-sm text-slate-500 mt-1">
            Gestiona tu información personal, roles y portafolio profesional.
          </p>
        </div>

        {/* Roles actuales */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Roles activos:</span>
          {roles.includes("cliente") && (
            <Badge variant="neutral" size="md">
              Cliente
            </Badge>
          )}
          {roles.includes("freelancer") && (
            <Badge variant="accent" size="md">
              Freelancer
            </Badge>
          )}
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl text-sm font-medium border ${
            feedback.type === "success"
              ? "bg-green-50 text-green-800 border-green-200"
              : "bg-red-50 text-red-700 border-red-200"
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* Selector de Rol Freelancer */}
      <Card
        title="Modo Freelancer"
        description="Activa este rol si deseas ofrecer servicios profesionales, postular a órdenes y recibir pagos vía escrow."
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50">
          <div>
            <h4 className="font-semibold text-slate-900 text-sm">
              {isFreelancer ? "Rol Freelancer: ACTIVO" : "Rol Freelancer: INACTIVO"}
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              {isFreelancer
                ? "Tienes acceso habilitado al Panel de Freelancer y tu perfil puede recibir pedidos."
                : "Tu cuenta actualmente solo opera en modo Cliente (contratar)."}
            </p>
          </div>

          <Button
            type="button"
            variant={isFreelancer ? "outline" : "secondary"}
            size="sm"
            disabled={roleUpdating}
            onClick={handleToggleFreelancerRole}
          >
            {roleUpdating
              ? "Actualizando..."
              : isFreelancer
              ? "Desactivar rol Freelancer"
              : "Activar rol Freelancer"}
          </Button>
        </div>
      </Card>

      {/* Formulario Modular de Perfil */}
      <ProfileForm
        data={formData}
        email={user?.email}
        isFreelancer={isFreelancer}
        saving={saving}
        onChange={handleFormDataChange}
        onSubmit={handleSaveProfile}
      />

      {/* Sección de Reputación y Reseñas para Freelancers (Fase 6) */}
      {isFreelancer && (
        <div className="space-y-6 pt-4 border-t border-slate-200">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
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
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
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
  );
}
