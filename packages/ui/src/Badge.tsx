import React, { type HTMLAttributes } from "react";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "primary" | "accent" | "neutral" | "warning" | "danger";
  size?: "sm" | "md";
}

export function Badge({
  variant = "neutral",
  size = "md",
  children,
  className = "",
  ...props
}: BadgeProps) {
  const variantStyles = {
    primary: "bg-primary text-white",
    accent: "bg-accent/15 text-emerald-800 border border-accent/30",
    neutral: "bg-slate-100 text-slate-700 border border-slate-200",
    warning: "bg-amber-50 text-amber-800 border border-amber-200",
    danger: "bg-red-50 text-red-700 border border-red-200",
  }[variant];

  const sizeStyles = {
    sm: "text-xs px-2 py-0.5",
    md: "text-xs font-medium px-2.5 py-1",
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium transition-colors ${variantStyles} ${sizeStyles} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
