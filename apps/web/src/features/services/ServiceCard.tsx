import React from "react";
import { Link } from "react-router-dom";
import type { ServiceWithFreelancer } from "@freelance/types";
import { Badge } from "@freelance/ui";
import { formatCurrency } from "@freelance/core";

interface ServiceCardProps {
  service: ServiceWithFreelancer;
}

export function ServiceCard({ service }: ServiceCardProps) {
  return (
    <div className="group rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col justify-between hover:border-[#70A9A1]/60">
      <div>
        {/* Cover Image / Placeholder */}
        <Link to={`/services/${service.id}`} className="block relative aspect-[16/9] bg-slate-100 overflow-hidden">
          {service.coverImage ? (
            <img
              src={service.coverImage}
              alt={service.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400">
              <span className="text-3xl">{service.category.icon || "💼"}</span>
              <span className="text-xs font-medium mt-1 text-slate-500">
                {service.category.name}
              </span>
            </div>
          )}
          <span className="absolute top-2.5 right-2.5">
            <Badge variant="neutral" size="sm" className="bg-white/90 backdrop-blur shadow-xs">
              {service.category.icon} {service.category.name}
            </Badge>
          </span>
        </Link>

        {/* Info Content */}
        <div className="p-4 space-y-3">
          {/* Freelancer Header */}
          <div className="flex items-center gap-2.5">
            {service.freelancer.avatarUrl ? (
              <img
                src={service.freelancer.avatarUrl}
                alt={service.freelancer.fullName || "Freelancer"}
                className="w-8 h-8 rounded-full object-cover border border-slate-200"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                {(service.freelancer.fullName || "F").charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-semibold text-slate-900 truncate">
                {service.freelancer.fullName || "Freelancer Profesional"}
              </h4>
              <p className="text-[11px] text-slate-500 truncate">
                {service.freelancer.headline || "Especialista verificado"}
              </p>
            </div>
          </div>

          {/* Service Title */}
          <Link to={`/services/${service.id}`} className="block">
            <h3 className="text-sm font-semibold text-slate-900 group-hover:text-primary transition-colors line-clamp-2 leading-snug">
              {service.title}
            </h3>
          </Link>

          {/* Stats: Rating & Delivery */}
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1 text-amber-500 font-semibold">
              ★ <span>{service.rating.toFixed(1)}</span>
              {service.reviewsCount > 0 && (
                <span className="text-slate-400 font-normal">({service.reviewsCount})</span>
              )}
            </span>
            <span>•</span>
            <span>⏱️ {service.deliveryDays} {service.deliveryDays === 1 ? "día" : "días"}</span>
          </div>
        </div>
      </div>

      {/* Footer / Price & CTA */}
      <div className="border-t border-slate-100 px-5 py-3.5 bg-slate-50/60 flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Desde
          </span>
          <span className="text-base font-black text-[#1F363D]">
            {formatCurrency(service.price)}
          </span>
        </div>

        <Link
          to={`/services/${service.id}`}
          className="text-xs font-bold text-[#40798C] hover:text-[#1F363D] transition-colors flex items-center gap-1"
        >
          <span>Ver servicio</span>
          <span>→</span>
        </Link>
      </div>
    </div>
  );
}
