import React, { type ButtonHTMLAttributes } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "dark" | "outline" | "ghost" | "danger";
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
    primary: "bg-[#40798C] text-white hover:bg-[#2E5664] shadow-sm border border-transparent",
    secondary: "bg-[#70A9A1] text-white hover:bg-[#559288] font-medium border border-transparent",
    dark: "bg-[#1F363D] text-white hover:bg-[#142429] shadow-sm border border-transparent",
    outline: "bg-white text-[#1F363D] border border-slate-200 hover:bg-[#F4F7F6] shadow-2xs",
    ghost: "bg-transparent text-[#1F363D] hover:bg-[#F4F7F6] border border-transparent",
    danger: "bg-rose-600 text-white hover:bg-rose-700 shadow-sm border border-transparent",
  }[variant];

  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs rounded-xl",
    md: "px-4 py-2 text-sm rounded-xl font-medium",
    lg: "px-6 py-2.5 text-base rounded-2xl font-semibold",
  }[size];

  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-[#40798C]/30 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98] ${variantStyles} ${sizeStyles} ${className}`}
    >
      {children}
    </button>
  );
}
