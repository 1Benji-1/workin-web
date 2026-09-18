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
    primary: "bg-[#1F363D] text-white",
    accent: "bg-[#CFE0C3] text-[#1F363D] border border-[#9EC1A3]/40 font-semibold",
    neutral: "bg-slate-100 text-[#1F363D] border border-slate-200",
    warning: "bg-amber-50 text-amber-800 border border-amber-200",
    danger: "bg-rose-50 text-rose-700 border border-rose-200",
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
