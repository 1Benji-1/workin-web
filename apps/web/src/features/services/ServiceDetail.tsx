import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getServiceById, getOrCreateConversation } from "@freelance/api";
import { supabase } from "../../shared/lib/supabaseClient";
import { useAuth } from "../../shared/context/AuthContext";
import { useReviews } from "../../hooks/useReviews";
import { RatingStars, RatingSummaryCard, ReviewsList } from "../reviews";
import { Badge, Button, Card } from "@freelance/ui";
import { formatCurrency } from "@freelance/core";

interface ServiceDetailData {
  id: string;
  title: string;
  description: string;
  price: number;
  delivery_days: number;
  cover_image: string | null;
  rating: number;
  reviews_count: number;
  freelancer?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    headline: string | null;
    bio: string | null;
    skills?: string[] | null;
    rating?: number | null;
  } | null;
  category?: {
    id: string;
    name: string;
    slug: string;
    icon: string | null;
  } | null;
}

export default function ServiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [service, setService] = useState<ServiceDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    reviews,
    summary,
    loading: reviewsLoading,
    handleReplyAdded,
  } = useReviews({ serviceId: id });

  useEffect(() => {
    async function loadService() {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const { data, error: sErr } = await getServiceById(supabase, id);
        if (sErr) {
          setError(sErr.message);
        } else if (data) {
          const detailData = data as unknown as ServiceDetailData;
          setService(detailData);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Error al cargar servicio");
      } finally {
        setLoading(false);
      }
    }

    loadService();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-slate-500">
        <span className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
        Cargando detalles del servicio...
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Servicio no encontrado</h2>
        <p className="text-sm text-slate-500">{error || "El servicio que buscas no existe o fue pausado."}</p>
        <Link to="/">
          <Button variant="outline">← Volver al Marketplace</Button>
        </Link>
      </div>
    );
  }

  const handleRequestService = () => {
    if (!user) {
      navigate("/login");
      return;
    }
    navigate(`/services/${service.id}/order`);
  };

  const handleContactFreelancer = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (!freelancer.id || freelancer.id === user.id) return;
    const res = await getOrCreateConversation(supabase, user.id, freelancer.id, null);
    if (res.data) {
      navigate(`/messages/${res.data.id}`);
    }
  };

  const category = service.category || {
    id: "general",
    name: "General",
    slug: "general",
    icon: "💼",
  };

  const freelancer = service.freelancer || {
    id: "freelancer",
    full_name: "Freelancer Profesional",
    avatar_url: null,
    headline: "Especialista verificado en WorkIn",
    bio: null,
    skills: [] as string[],
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs text-slate-500">
        <Link to="/" className="hover:text-primary transition-colors">
          Inicio
        </Link>
        <span>/</span>
        <Link
          to={`/categories/${category.slug}`}
          className="hover:text-primary transition-colors"
        >
          {category.name}
        </Link>
        <span>/</span>
        <span className="text-slate-800 font-medium truncate max-w-xs sm:max-w-md">
          {service.title}
        </span>
      </nav>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Columna Izquierda: Información Principal */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <Badge variant="accent" size="sm">
                {category.icon} {category.name}
              </Badge>
              <RatingStars
                rating={summary.count > 0 ? summary.average : Number(service.rating)}
                size="sm"
                showValue
                showCount
                count={summary.count > 0 ? summary.count : service.reviews_count}
              />
              <span className="text-xs text-slate-400">ID: {service.id.slice(0, 8)}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
              {service.title}
            </h1>
          </div>

          {/* Cover Image / Placeholder */}
          <div className="rounded-xl overflow-hidden border border-slate-200 aspect-video bg-slate-100 flex items-center justify-center">
            {service.cover_image ? (
              <img
                src={service.cover_image}
                alt={service.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-400">
                <span className="text-5xl">{category.icon || "💼"}</span>
                <span className="text-sm font-medium mt-2 text-slate-500">
                  {category.name}
                </span>
              </div>
            )}
          </div>

          {/* Descripción del Servicio */}
          <Card title="Acerca de este servicio">
            <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {service.description}
            </div>
          </Card>

          {/* Tarjeta del Freelancer */}
          <Card title="Acerca del Freelancer">
            <div className="flex items-start gap-4">
              {freelancer.avatar_url ? (
                <img
                  src={freelancer.avatar_url}
                  alt={freelancer.full_name || "Freelancer"}
                  className="w-14 h-14 rounded-full object-cover border border-slate-200"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-primary/10 text-primary font-bold text-xl flex items-center justify-center">
                  {(freelancer.full_name || "F").charAt(0).toUpperCase()}
                </div>
              )}

              <div className="space-y-1.5 flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-base text-slate-900">
                    {freelancer.full_name || "Freelancer Profesional"}
                  </h3>
                  <Badge variant="neutral" size="sm">
                    ⭐ {Number(service.rating).toFixed(1)}
                  </Badge>
                </div>

                <p className="text-xs text-slate-600 font-medium">
                  {freelancer.headline || "Especialista verificado en WorkIn"}
                </p>

                {freelancer.bio && (
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    {freelancer.bio}
                  </p>
                )}

                {freelancer.skills && freelancer.skills.length > 0 && (
                  <div className="pt-2 flex flex-wrap gap-1.5">
                    {freelancer.skills.map((skill: string) => (
                      <Badge key={skill} variant="neutral" size="sm">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                )}

                {user?.id !== freelancer.id && (
                  <div className="pt-3 border-t border-slate-100 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleContactFreelancer}
                      className="text-xs font-semibold text-primary border-primary/30 hover:bg-primary/5 flex items-center gap-1.5"
                    >
                      <span>💬</span> Contactar Freelancer
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Calificaciones y Reseñas de Clientes (Fase 6) */}
          <div className="space-y-6">
            <RatingSummaryCard summary={summary} title="Calificaciones del Servicio" />

            <div className="space-y-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>💬</span> Reseñas de Clientes ({summary.count})
              </h3>
              <ReviewsList
                reviews={reviews}
                loading={reviewsLoading}
                currentUserId={user?.id}
                onReplySuccess={handleReplyAdded}
                emptyMessage="Este servicio aún no tiene reseñas de clientes. ¡Sé el primero en calificarlo tras completar un pedido!"
              />
            </div>
          </div>
        </div>

        {/* Columna Derecha: Contratación y Condiciones */}
        <div className="space-y-6">
          <Card className="sticky top-20 shadow-md border-slate-200">
            <div className="space-y-4">
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-400 block tracking-wider mb-1">
                  Precio orientativo
                </span>
                <span className="text-3xl font-black text-primary">
                  Desde {formatCurrency(service.price)}
                </span>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Es una tarifa de referencia. El precio final y el alcance se definen con el freelancer a través del chat antes de activar el pago.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-2">
                <div className="flex items-center gap-2">
                  <span>⏱️</span>
                  <span>Tiempo de entrega estimado: <strong>{service.delivery_days} {service.delivery_days === 1 ? "día" : "días"}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <span>💬</span>
                  <span>Alcance acordado mediante chat</span>
                </div>
              </div>

              {/* Botón CTA */}
              <Button
                onClick={handleRequestService}
                size="lg"
                className="w-full font-bold shadow-md text-sm"
              >
                Solicitar Servicio
              </Button>

              {/* Garantía Escrow */}
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                  <span>🛡️</span>
                  <span>Garantía de Pago Seguro (Escrow)</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">
                  Tu dinero queda protegido en la plataforma. Solo se libera al freelancer cuando confirmes la entrega conforme de tu trabajo.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
