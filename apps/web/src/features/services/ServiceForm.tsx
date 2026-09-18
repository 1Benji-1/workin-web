import React, { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useAuth } from "../../shared/context/AuthContext";
import { useCategories } from "../../hooks/useCategories";
import { createService, getServiceById, updateService } from "@freelance/api";
import { supabase } from "../../shared/lib/supabaseClient";
import { Card, Input, Button } from "@freelance/ui";
import { ImageUpload } from "../../shared/components/ImageUpload";

export default function ServiceForm() {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);

  const { user } = useAuth();
  const { categories, loading: loadingCats } = useCategories();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [deliveryDays, setDeliveryDays] = useState("3");
  const [coverImage, setCoverImage] = useState("");
  const [status, setStatus] = useState<"active" | "paused">("active");

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isEditing && id) {
      getServiceById(supabase, id).then(({ data, error }) => {
        if (error || !data) {
          setErrorMsg("No se pudo cargar el servicio para edición.");
        } else {
          // Verificar que el usuario sea el dueño
          if (user && data.freelancer_id !== user.id) {
            setErrorMsg("No tienes permisos para editar este servicio.");
            return;
          }
          setTitle(data.title);
          setCategoryId(data.category_id);
          setDescription(data.description);
          setPrice(String(data.price));
          setDeliveryDays(String(data.delivery_days));
          setCoverImage(data.cover_image || "");
          setStatus(data.status as "active" | "paused");
        }
      });
    }
  }, [id, isEditing, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setErrorMsg(null);

    if (!categoryId) {
      setErrorMsg("Debes seleccionar una categoría para tu servicio.");
      return;
    }

    setSubmitting(true);

    try {
      if (isEditing && id) {
        const { error } = await updateService(supabase, id, {
          title,
          category_id: categoryId,
          description,
          price: parseFloat(price),
          delivery_days: parseInt(deliveryDays, 10),
          cover_image: coverImage || null,
          status,
        });

        setSubmitting(false);
        if (error) {
          setErrorMsg(error.message);
        } else {
          navigate(`/services/${id}`);
        }
      } else {
        const { data: newService, error } = await createService(
          supabase,
          {
            freelancer_id: user.id,
            category_id: categoryId,
            title,
            description,
            price: parseFloat(price),
            delivery_days: parseInt(deliveryDays, 10),
            cover_image: coverImage || null,
            status,
          }
        );

        setSubmitting(false);
        if (error || !newService) {
          setErrorMsg(error?.message || "Error al crear el servicio.");
        } else {
          navigate(`/services/${newService.id}`);
        }
      }
    } catch (err: unknown) {
      setSubmitting(false);
      setErrorMsg(err instanceof Error ? err.message : "Error inesperado al guardar servicio.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">
            {isEditing ? "Editar Servicio" : "Publicar Nuevo Servicio"}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Ofrece tus habilidades profesionales y empieza a recibir propuestas con pago seguro.
          </p>
        </div>
        <Link to="/freelancer/dashboard">
          <Button variant="outline" size="sm">
            ← Volver al Panel
          </Button>
        </Link>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card title="Información Principal del Servicio">
          <div className="space-y-4">
            <Input
              label="Título del Servicio"
              placeholder="Ej: Desarrollo de Sitio Web Responsivo en React y Tailwind"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              helperText="Sé claro y descriptivo sobre lo que entregarás al cliente."
            />

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Categoría
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
                disabled={loadingCats}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Selecciona una categoría...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Descripción Detallada del Alcance
              </label>
              <textarea
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                placeholder="Explica detalladamente qué incluye tu oferta, entregables, metodologías y requisitos que necesitas del cliente..."
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        </Card>

        <Card title="Precios y Plazos de Entrega">
          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              label="Precio desde (Bs)"
              type="number"
              min="5"
              step="1"
              placeholder="Ej: 50.00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
              helperText="Es un precio orientativo. El precio final se acuerda con cada cliente antes de activar el pago."
            />

            <Input
              label="Tiempo de Entrega (Días)"
              type="number"
              min="1"
              max="90"
              placeholder="3"
              value={deliveryDays}
              onChange={(e) => setDeliveryDays(e.target.value)}
              required
              helperText="Días calendario estimados para la primera entrega."
            />

            <div className="sm:col-span-2">
              <ImageUpload
                label="Foto de Portada del Servicio (Opcional)"
                mode="cover"
                folder="services"
                value={coverImage}
                onChange={(url) => setCoverImage(url)}
                helperText="Si no seleccionas una imagen, se usará el icono representativo de la categoría."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Estado del Servicio
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as "active" | "paused")}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-primary focus:outline-none"
              >
                <option value="active">Activo (visible en Marketplace)</option>
                <option value="paused">Pausado (oculto temporalmente)</option>
              </select>
            </div>
          </div>
        </Card>

        <div className="flex justify-end gap-3 pt-2">
          <Link to="/freelancer/dashboard">
            <Button type="button" variant="ghost">
              Cancelar
            </Button>
          </Link>
          <Button type="submit" size="lg" disabled={submitting}>
            {submitting ? "Guardando..." : isEditing ? "Actualizar Servicio" : "Publicar Servicio Ahora"}
          </Button>
        </div>
      </form>
    </div>
  );
}
