import React from "react";
import { cn } from "@/lib/utils";

interface AvatarProps {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Avatar({ name, size = "md", className }: AvatarProps) {
  const getInitials = (n: string) => {
    const parts = n.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return (n.slice(0, 2) || "EC").toUpperCase();
  };

  const sizeStyles = {
    sm: "w-7 h-7 text-[10px]",
    md: "w-9 h-9 text-xs",
    lg: "w-11 h-11 text-sm font-semibold",
  };

  // Consistent pleasant background color based on name
  const colors = [
    "bg-blue-100 text-blue-700 border-blue-200",
    "bg-indigo-100 text-indigo-700 border-indigo-200",
    "bg-teal-100 text-teal-700 border-teal-200",
    "bg-purple-100 text-purple-700 border-purple-200",
    "bg-amber-100 text-amber-700 border-amber-200",
  ];
  const colorIndex = Math.abs(name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)) % colors.length;

  return (
    <div
      title={name}
      className={cn(
        "rounded-full flex items-center justify-center font-bold border select-none shrink-0",
        sizeStyles[size],
        colors[colorIndex],
        className
      )}
    >
      {getInitials(name)}
    </div>
  );
}

export function AvatarGroup({
  users,
  max = 3,
}: {
  users: { name: string; email?: string }[];
  max?: number;
}) {
  const displayed = users.slice(0, max);
  const remaining = users.length - max;

  return (
    <div className="flex items-center -space-x-2 overflow-hidden">
      {displayed.map((u, i) => (
        <Avatar key={i} name={u.name} size="sm" className="ring-2 ring-white" />
      ))}
      {remaining > 0 && (
        <div className="w-7 h-7 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center text-[10px] font-bold ring-2 ring-white select-none">
          +{remaining}
        </div>
      )}
    </div>
  );
}
