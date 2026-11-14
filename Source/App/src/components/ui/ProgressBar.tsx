import React from "react";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number; // 0 to 100
  showLabel?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "success" | "auto";
}

export function ProgressBar({
  value,
  showLabel = true,
  className,
  size = "md",
  variant = "auto",
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, Math.round(value)));

  const sizeStyles = {
    sm: "h-1.5",
    md: "h-2.5",
    lg: "h-4",
  };

  const getColor = () => {
    if (variant === "success") return "bg-status-completed";
    if (variant === "primary") return "bg-brand-500";
    if (clamped >= 100) return "bg-status-completed";
    if (clamped >= 50) return "bg-brand-500";
    if (clamped >= 25) return "bg-[#FF9F43]";
    return "bg-gray-400";
  };

  return (
    <div className={cn("w-full flex items-center gap-3", className)}>
      <div className={cn("w-full bg-gray-100 rounded-full overflow-hidden flex-1", sizeStyles[size])}>
        <div
          className={cn("h-full transition-all duration-300 ease-out rounded-full", getColor())}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-semibold text-dash-textSecondary min-w-[35px] text-right">
          {clamped}%
        </span>
      )}
    </div>
  );
}
