import React from "react";
import type { PortfolioItem } from "@freelance/types";
import { Card, Input, Button, Badge } from "@freelance/ui";
import { SkillsTags } from "./SkillsTags";
import { PortfolioSection } from "./PortfolioSection";

export interface ProfileFormData {
  fullName: string;
  phone: string;
  phoneVerified: boolean;
  avatarUrl: string;
  headline: string;
  bio: string;
  hourlyRate: string;
  skills: string[];
  portfolio: PortfolioItem[];
}

interface ProfileFormProps {
  data: ProfileFormData;
  email?: string;
  isFreelancer: boolean;
  saving: boolean;
  onChange: (updates: Partial<ProfileFormData>) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function ProfileForm({
  data,
  email,
  isFreelancer,
  saving,
  onChange,
  onSubmit,
}: ProfileFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* 1. Datos Personales / Cuenta */}
      <Card title="Datos de la Cuenta" description="Información básica de tu perfil visible para otros usuarios">
        <div className="grid sm:grid-cols-2 gap-4">
          <Input
            label="Nombre completo"
            value={data.fullName}
            onChange={(e) => onChange({ fullName: e.target.value })}
            placeholder="Tu nombre y apellido"
            required
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Correo electrónico
            </label>
            <input
              type="email"
              value={email || ""}
              disabled
              className="w-full rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-500 cursor-not-allowed"
            />
            <span className="text-xs text-emerald-600 font-medium inline-block mt-1">
              ✓ Correo verificado por Supabase Auth
            </span>
          </div>

          <Input
            label="Teléfono de contacto"
            type="tel"
            value={data.phone}
            onChange={(e) => onChange({ phone: e.target.value })}
            placeholder="+1234567890"
          />

          <div className="flex flex-col justify-center">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Verificación de Identidad (Teléfono)
            </label>
            <div className="flex items-center gap-3">
              <Badge variant={data.phoneVerified ? "accent" : "warning"} size="md">
                {data.phoneVerified ? "✓ Verificado" : "Pendiente de verificación"}
              </Badge>
              <button
                type="button"
                onClick={() => onChange({ phoneVerified: !data.phoneVerified })}
                className="text-xs text-primary hover:underline"
              >
                {data.phoneVerified ? "Marcar no verificado" : "Simular verificación SMS"}
              </button>
            </div>
          </div>

          <div className="sm:col-span-2">
            <Input
              label="URL de Foto de Perfil (Avatar)"
              type="url"
              value={data.avatarUrl}
              onChange={(e) => onChange({ avatarUrl: e.target.value })}
              placeholder="https://ejemplo.com/avatar.jpg"
              helperText="En la Fase 2 podrás subir archivos directamente a Supabase Storage."
            />
          </div>
        </div>
      </Card>

      {/* 2. Sección Profesional de Freelancer */}
      {isFreelancer && (
        <div className="space-y-6">
          <Card
            title="Perfil Profesional (Freelancer)"
            description="Detalles para promocionar tus servicios ante potenciales clientes."
          >
            <div className="space-y-4">
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <Input
                    label="Título profesional"
                    value={data.headline}
                    onChange={(e) => onChange({ headline: e.target.value })}
                    placeholder="Ej: Desarrollador Frontend React & TypeScript"
                  />
                </div>
                <div>
                  <Input
                    label="Tarifa por hora (Bs)"
                    type="number"
                    step="1"
                    min="0"
                    value={data.hourlyRate}
                    onChange={(e) => onChange({ hourlyRate: e.target.value })}
                    placeholder="Ej: 150.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Biografía / Presentación
                </label>
                <textarea
                  rows={4}
                  value={data.bio}
                  onChange={(e) => onChange({ bio: e.target.value })}
                  placeholder="Describe tu experiencia, tecnologías preferidas y cómo ayudas a tus clientes a tener éxito..."
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          </Card>

          {/* Habilidades */}
          <Card
            title="Habilidades y Competencias"
            description="Añade las tecnologías o áreas en las que te destacas."
          >
            <SkillsTags
              skills={data.skills}
              onChange={(skills) => onChange({ skills })}
            />
          </Card>

          {/* Portafolio */}
          <Card
            title="Portafolio de Trabajos"
            description="Muestra casos de éxito y proyectos previos para validar tu experiencia."
          >
            <PortfolioSection
              portfolio={data.portfolio}
              onChange={(portfolio) => onChange({ portfolio })}
            />
          </Card>
        </div>
      )}

      {/* Botón de Guardar Cambios */}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="submit" size="lg" disabled={saving}>
          {saving ? "Guardando cambios..." : "Guardar Perfil"}
        </Button>
      </div>
    </form>
  );
}
