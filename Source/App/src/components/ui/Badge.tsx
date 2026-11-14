import React from "react";
import { cn } from "@/lib/utils";
import { ProjectPriority, ProjectStatus } from "@/types";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "primary" | "success" | "warning" | "danger" | "neutral";
  className?: string;
}

export function Badge({ children, variant = "neutral", className }: BadgeProps) {
  const variantStyles = {
    primary: "bg-[#EEF4FF] text-[#4880FF] border-[#D9E5FF]",
    success: "bg-[#E6F8F5] text-[#00B69B] border-[#B2EDE4]",
    warning: "bg-[#FFF6E9] text-[#FF9F43] border-[#FFE2C2]",
    danger: "bg-[#FEECEB] text-[#EF3826] border-[#FDB8B4]",
    neutral: "bg-gray-100 text-gray-700 border-gray-200",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-colors",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: ProjectStatus }) {
  switch (status) {
    case "COMPLETED":
      return <Badge variant="success">Completed</Badge>;
    case "IN_PROGRESS":
      return <Badge variant="primary">In Progress</Badge>;
    case "PENDING_REVIEW":
      return <Badge variant="warning">Pending Review</Badge>;
    case "REVISION_REQUESTED":
      return <Badge variant="danger">Revision Requested</Badge>;
    case "NOT_STARTED":
    default:
      return <Badge variant="neutral">Not Started</Badge>;
  }
}

export function PriorityBadge({ priority }: { priority: ProjectPriority }) {
  switch (priority) {
    case "URGENT":
      return <Badge variant="danger">Urgent</Badge>;
    case "HIGH":
      return <Badge variant="warning">High</Badge>;
    case "MEDIUM":
      return <Badge variant="primary">Medium</Badge>;
    case "LOW":
    default:
      return <Badge variant="neutral">Low</Badge>;
  }
}
