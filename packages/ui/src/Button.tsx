import React, { type ButtonHTMLAttributes } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: ButtonProps) {
  const variantStyles = {
    primary: "bg-primary text-white hover:bg-slate-800 shadow-sm border border-transparent",
    secondary: "bg-accent text-slate-900 hover:bg-emerald-400 font-semibold border border-transparent",
    outline: "bg-white text-slate-800 border border-slate-300 hover:bg-slate-50 shadow-sm",
    ghost: "bg-transparent text-slate-700 hover:bg-slate-100 border border-transparent",
    danger: "bg-red-600 text-white hover:bg-red-700 shadow-sm border border-transparent",
  }[variant];

  const sizeStyles = {
    sm: "px-2.5 py-1 text-xs rounded-md",
    md: "px-4 py-2 text-sm rounded-lg",
    lg: "px-6 py-2.5 text-base rounded-lg",
  }[size];

  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 ${variantStyles} ${sizeStyles} ${className}`}
    >
      {children}
    </button>
  );
}
