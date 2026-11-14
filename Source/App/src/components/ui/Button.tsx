import React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  icon,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center font-medium rounded-smDash transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const sizeStyles = {
    sm: "text-xs px-3 py-1.5 gap-1.5",
    md: "text-sm px-4 py-2 gap-2",
    lg: "text-base px-6 py-2.5 gap-2.5",
  };

  const variantStyles = {
    primary:
      "bg-brand-500 hover:bg-brand-600 text-white shadow-sm focus:ring-brand-500",
    secondary:
      "bg-brand-50 text-brand-600 hover:bg-brand-100 focus:ring-brand-500",
    outline:
      "border border-dash-border bg-white text-dash-textPrimary hover:bg-gray-50 focus:ring-gray-400",
    danger:
      "bg-status-delayed hover:bg-red-700 text-white focus:ring-red-500",
    ghost:
      "bg-transparent text-dash-textSecondary hover:bg-gray-100 focus:ring-gray-300",
  };

  return (
    <button
      className={cn(base, sizeStyles[size], variantStyles[variant], className)}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="inline-flex shrink-0">{icon}</span>}
      {children}
    </button>
  );
}
