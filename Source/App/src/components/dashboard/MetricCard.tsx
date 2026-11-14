import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: string;
    isUp: boolean;
  };
  icon: React.ReactNode;
  iconBgColor?: string;
  className?: string;
}

export function MetricCard({
  title,
  value,
  subtitle,
  trend,
  icon,
  iconBgColor = "bg-brand-50 text-brand-500",
  className,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-dash p-6 shadow-dashCard border border-dash-border/40 flex items-center justify-between transition-all hover:shadow-dashHover",
        className
      )}
    >
      <div>
        <p className="text-xs font-bold text-dash-textSecondary uppercase tracking-wider mb-1">
          {title}
        </p>
        <h3 className="text-2xl font-extrabold text-dash-textPrimary tracking-tight">
          {value}
        </h3>
        {trend && (
          <div className="flex items-center gap-1.5 mt-2.5 text-xs font-semibold">
            <span
              className={cn(
                "inline-flex items-center gap-0.5",
                trend.isUp ? "text-status-completed" : "text-status-delayed"
              )}
            >
              {trend.isUp ? (
                <TrendingUp className="w-3.5 h-3.5" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5" />
              )}
              {trend.value}
            </span>
            <span className="text-gray-400 font-normal">vs last month</span>
          </div>
        )}
        {subtitle && !trend && (
          <p className="text-xs text-dash-textSecondary mt-2">{subtitle}</p>
        )}
      </div>

      <div
        className={cn(
          "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
          iconBgColor
        )}
      >
        {icon}
      </div>
    </div>
  );
}
