import React from "react";
import type { RatingSummary } from "@freelance/types";
import { getRatingLabel } from "@freelance/core";
import { RatingStars } from "./RatingStars";

interface RatingSummaryCardProps {
  summary: RatingSummary;
  title?: string;
  className?: string;
}

export const RatingSummaryCard: React.FC<RatingSummaryCardProps> = ({
  summary,
  title = "Calificaciones y Reputación",
  className = "",
}) => {
  const starsList = [5, 4, 3, 2, 1] as const;

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 p-6 shadow-sm ${className}`}>
      {title && (
        <h3 className="text-base font-bold text-slate-900 mb-5 flex items-center gap-2">
          <span>⭐</span> {title}
        </h3>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Puntuación General */}
        <div className="md:col-span-5 flex flex-col items-center justify-center p-4 bg-slate-50/80 rounded-xl border border-slate-100 text-center">
          <span className="text-5xl font-black text-slate-900 tracking-tight">
            {summary.average > 0 ? summary.average.toFixed(1) : "0.0"}
          </span>
          <div className="mt-2">
            <RatingStars rating={summary.average} size="md" />
          </div>
          <span className="text-sm font-medium text-amber-700 mt-1">
            {summary.count > 0 ? getRatingLabel(summary.average) : "Sin calificaciones aún"}
          </span>
          <span className="text-xs text-slate-400 mt-0.5">
            Basado en {summary.count} {summary.count === 1 ? "reseña verificada" : "reseñas verificadas"}
          </span>
        </div>

        {/* Desglose por Estrellas (Barras) */}
        <div className="md:col-span-7 space-y-2.5">
          {starsList.map((stars) => {
            const count = summary.breakdown[stars] || 0;
            const percentage = summary.percentages[stars] || 0;

            return (
              <div key={stars} className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1 w-12 font-medium text-slate-700">
                  <span>{stars}</span>
                  <span className="text-amber-400">★</span>
                </div>

                <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                <div className="w-12 text-right text-slate-400 font-medium">
                  {percentage}% ({count})
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
