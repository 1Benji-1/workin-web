import React, { type HTMLAttributes } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
}

export function Card({ title, description, children, className = "", ...props }: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs ${className}`}
      {...props}
    >
      {(title || description) && (
        <div className="mb-4 border-b border-slate-100 pb-3">
          {title && <h3 className="text-lg font-bold text-[#1F363D]">{title}</h3>}
          {description && <p className="text-sm text-slate-500 mt-0.5">{description}</p>}
        </div>
      )}
      {children}
    </div>
  );
}
