import React, { useState } from "react";
import type { PortfolioItem } from "@freelance/types";
import { Button, Input } from "@freelance/ui";

interface PortfolioSectionProps {
  portfolio: PortfolioItem[];
  onChange: (items: PortfolioItem[]) => void;
}

export function PortfolioSection({ portfolio, onChange }: PortfolioSectionProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectUrl, setProjectUrl] = useState("");

  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    const newItem: PortfolioItem = {
      id: "p_" + Date.now(),
      title: title.trim(),
      description: description.trim(),
      projectUrl: projectUrl.trim() || undefined,
    };

    onChange([...portfolio, newItem]);
    setTitle("");
    setDescription("");
    setProjectUrl("");
    setShowAddForm(false);
  };

  const handleRemove = (id: string) => {
    onChange(portfolio.filter((item) => item.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">
          Muestra tus mejores trabajos previos para generar confianza con clientes.
        </p>
        {!showAddForm && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setShowAddForm(true)}
          >
            + Añadir Proyecto
          </Button>
        )}
      </div>

      {/* Formulario para añadir proyecto */}
      {showAddForm && (
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/80 space-y-3">
          <h4 className="text-sm font-semibold text-slate-900">Nuevo Proyecto de Portafolio</h4>
          <form onSubmit={handleAddProject} className="space-y-3">
            <Input
              label="Título del proyecto"
              placeholder="Ej: Rediseño App Móvil Finanzas"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Descripción del trabajo realizado
              </label>
              <textarea
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                rows={2}
                placeholder="Explica qué problema resolviste, tecnologías usadas o resultados..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>
            <Input
              label="Enlace al proyecto (opcional)"
              type="url"
              placeholder="https://github.com/... o https://miweb.com"
              value={projectUrl}
              onChange={(e) => setProjectUrl(e.target.value)}
            />
            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setShowAddForm(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" size="sm">
                Guardar Proyecto
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de proyectos */}
      {portfolio.length > 0 ? (
        <div className="grid sm:grid-cols-2 gap-3">
          {portfolio.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-lg border border-slate-200 bg-white relative group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h5 className="font-semibold text-sm text-slate-900">{item.title}</h5>
                  <button
                    type="button"
                    onClick={() => handleRemove(item.id)}
                    className="text-xs text-slate-400 hover:text-red-600 transition-colors p-1"
                    title="Eliminar proyecto"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-xs text-slate-600 mt-1 line-clamp-3">{item.description}</p>
              </div>

              {item.projectUrl && (
                <div className="mt-3 pt-2 border-t border-slate-100">
                  <a
                    href={item.projectUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-accent font-medium hover:underline inline-flex items-center gap-1"
                  >
                    Ver proyecto ↗
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        !showAddForm && (
          <div className="text-center py-6 border border-dashed border-slate-200 rounded-lg text-xs text-slate-400">
            Aún no has añadido ningún proyecto a tu portafolio.
          </div>
        )
      )}
    </div>
  );
}
