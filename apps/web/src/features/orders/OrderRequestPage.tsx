import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../shared/context/AuthContext";
import { getServiceById, createOrder } from "@freelance/api";
import { supabase } from "../../shared/lib/supabaseClient";
import { Button, Input, Card, Badge } from "@freelance/ui";
import { formatCurrency } from "@freelance/core";

interface RequestedService {
  id: string;
  freelancer_id: string;
  title: string;
  description: string;
  price: number;
  delivery_days: number;
  freelancer?: {
    full_name: string | null;
  } | null;
  category?: {
    name: string;
    icon: string | null;
  } | null;
}

export default function OrderRequestPage() {
  const { serviceId } = useParams<{ serviceId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [service, setService] = useState<RequestedService | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deliveryDays, setDeliveryDays] = useState("3");
  const [requirementsList, setRequirementsList] = useState<string[]>([
    "Entrega de archivos fuente editables",
    "Revisión y ajustes según especificaciones",
  ]);
  const [newReqInput, setNewReqInput] = useState("");

  useEffect(() => {
    async function loadService() {
      if (!serviceId) return;
      setLoading(true);
      try {
        const { data, error } = await getServiceById(supabase, serviceId);
        if (error || !data) {
          setErrorMsg("No se encontró el servicio solicitado.");
        } else {
          const srv = data as unknown as RequestedService;
          setService(srv);
          setTitle(`Solicitud: ${srv.title}`);
          setDeliveryDays(String(srv.delivery_days || 3));
          setDescription(`Solicitud para el servicio: ${srv.title}.\nDetalles del requerimiento: `);
        }
      } catch (err: unknown) {
        setErrorMsg(err instanceof Error ? err.message : "Error al cargar servicio");
      } finally {
        setLoading(false);
      }
    }

    loadService();
  }, [serviceId]);

  const handleAddRequirement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReqInput.trim()) return;
    setRequirementsList((prev) => [...prev, newReqInput.trim()]);
    setNewReqInput("");
  };

  const handleRemoveRequirement = (idx: number) => {
    setRequirementsList((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !service) return;

    if (user.id === service.freelancer_id) {
      setErrorMsg("No puedes contratar un servicio que tú mismo publicaste.");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const { data: newOrder, error } = await createOrder(supabase, {
        clientId: user.id,
        freelancerId: service.freelancer_id,
        serviceId: service.id,
        title,
        description,
        deliveryDays: parseInt(deliveryDays, 10),
        requirements: requirementsList,
      });

      if (error || !newOrder) {
        throw new Error(error?.message || "Error al crear la orden de servicio");
      }

      navigate(`/orders/${newOrder.id}`);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Error al procesar la solicitud");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-slate-500">
        <span className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
        Cargando formulario de contratación...
      </div>
    );
  }

  if (!service) {
    return (
      <div className="max-w-xl mx-auto p-8 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Servicio no disponible</h2>
        <p className="text-xs text-slate-500">{errorMsg || "No fue posible cargar el servicio."}</p>
        <Link to="/">
          <Button variant="outline">Volver al Marketplace</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-slate-500">
        <Link to="/" className="hover:text-primary transition-colors">Marketplace</Link>
        <span>/</span>
        <Link to={`/services/${service.id}`} className="hover:text-primary transition-colors">
          {service.title}
        </Link>
        <span>/</span>
        <span className="text-slate-800 font-medium">Nueva Solicitud de Contratación</span>
      </nav>

      <div className="border-b border-slate-200 pb-4">
        <Badge variant="primary" size="sm" className="mb-2">
          Fase 3: Contratación y Acuerdos
        </Badge>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          Solicitar Servicio Profesional
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Define el alcance y requerimientos. El pago no se realiza ahora; el precio final se coordina mediante el chat y el profesional activará el pago una vez que ambos estén conformes.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
          {errorMsg}
        </div>
      )}

      {/* Resumen del Servicio */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-xl flex-shrink-0 border border-slate-200">
            {service.category?.icon || "💼"}
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900">{service.title}</h3>
            <p className="text-xs text-slate-500">
              Ofrecido por: <strong className="text-slate-700">{service.freelancer?.full_name || "Freelancer"}</strong>
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:items-end">
          <span className="text-xs text-slate-400 font-medium">Precio orientativo:</span>
          <span className="text-xl font-black text-primary">Desde {formatCurrency(service.price)}</span>
        </div>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card title="Alcance del Proyecto">
          <div className="space-y-4">
            <Input
              label="Título del Acuerdo / Proyecto"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="Ej: Desarrollo de landing page para startup"
            />

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Descripción Detallada de lo que Necesitas
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                placeholder="Explica el objetivo de tu proyecto, material con el que cuentas y cualquier directiva importante..."
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        </Card>

        <Card title="Tiempo de Entrega Estimado">
          <div className="space-y-3">
            <Input
              label="Tiempo de Entrega Estimado (Días)"
              type="number"
              min="1"
              max="90"
              value={deliveryDays}
              onChange={(e) => setDeliveryDays(e.target.value)}
              required
              helperText="Días calendario estimados para la entrega final."
            />
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2">
              <span className="text-sm">💡</span>
              <p>
                <strong>Nota sobre el precio:</strong> La solicitud se crea sin monto prefijado. Podrás afinar los detalles por el chat del proyecto y el freelancer definirá el precio final convenido antes de activar el pago en custodia (Escrow).
              </p>
            </div>
          </div>
        </Card>

        <Card
          title="Entregables Iniciales (Checklist de Requerimientos)"
          description="Agrega los puntos concretos que el freelancer debe entregar para considerar completo el trabajo."
        >
          <div className="space-y-3">
            <div className="space-y-2">
              {requirementsList.map((req, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs"
                >
                  <span className="font-medium text-slate-800">
                    {idx + 1}. {req}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveRequirement(idx)}
                    className="text-xs text-red-500 hover:text-red-700 font-semibold px-2 py-0.5"
                  >
                    Eliminar
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-2">
              <input
                type="text"
                value={newReqInput}
                onChange={(e) => setNewReqInput(e.target.value)}
                placeholder="Añadir otro entregable específico..."
                className="flex-1 rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-800 focus:border-primary focus:outline-none"
              />
              <Button type="button" size="sm" onClick={handleAddRequirement} disabled={!newReqInput.trim()}>
                + Agregar
              </Button>
            </div>
          </div>
        </Card>

        <div className="flex justify-end gap-3 pt-2">
          <Link to={`/services/${service.id}`}>
            <Button type="button" variant="ghost">
              Cancelar
            </Button>
          </Link>
          <Button type="submit" size="lg" disabled={submitting}>
            {submitting ? "Enviando Solicitud..." : "Enviar Solicitud de Contratación"}
          </Button>
        </div>
      </form>
    </div>
  );
}
