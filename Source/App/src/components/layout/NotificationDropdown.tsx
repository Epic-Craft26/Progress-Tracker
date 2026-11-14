"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCheck,
  ExternalLink,
  CheckCircle2,
  Clock,
  Briefcase,
  AlertCircle,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
}

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  unreadCount: number;
  onMarkAllAsRead: () => void;
  onMarkItemAsRead: (id: string) => void;
}

export function NotificationDropdown({
  isOpen,
  onClose,
  notifications,
  unreadCount,
  onMarkAllAsRead,
  onMarkItemAsRead,
}: NotificationDropdownProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "APPROVAL":
        return <CheckCircle2 className="w-4 h-4 text-status-pending" />;
      case "ASSIGNED":
        return <Briefcase className="w-4 h-4 text-brand-500" />;
      case "UPDATE":
        return <Clock className="w-4 h-4 text-status-completed" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatRelativeTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-14 w-80 sm:w-96 bg-white rounded-dash shadow-2xl border border-dash-border/80 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
    >
      {/* Header */}
      <div className="p-4 border-b border-dash-border/60 flex items-center justify-between bg-[#FBFBFC]">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-brand-500" />
          <h3 className="text-sm font-bold text-dash-textPrimary">Notifications</h3>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-500 text-white">
              {unreadCount} new
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllAsRead}
              className="text-[11px] font-bold text-brand-600 hover:text-brand-800 flex items-center gap-1 transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark all read</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Close notification panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Body List */}
      <div className="max-h-[380px] overflow-y-auto divide-y divide-dash-border/40">
        {notifications.length === 0 ? (
          <div className="py-12 px-6 text-center">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-3 text-brand-500">
              <Bell className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-dash-textPrimary">All caught up!</h4>
            <p className="text-xs text-dash-textSecondary mt-1">
              You have no new alerts. Real-time updates on assignments and progress will appear here.
            </p>
          </div>
        ) : (
          notifications.map((item) => (
            <div
              key={item.id}
              onClick={() => onMarkItemAsRead(item.id)}
              className={`p-3.5 transition-colors flex items-start gap-3 cursor-pointer ${
                item.isRead
                  ? "bg-white hover:bg-gray-50/80"
                  : "bg-blue-50/40 hover:bg-blue-50/70"
              }`}
            >
              <div className="p-2 rounded-lg bg-white border border-dash-border/60 shadow-xs shrink-0 mt-0.5">
                {getTypeIcon(item.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <h5
                    className={`text-xs truncate ${
                      item.isRead
                        ? "font-medium text-dash-textPrimary"
                        : "font-bold text-dash-textPrimary"
                    }`}
                  >
                    {item.title}
                  </h5>
                  <span className="text-[10px] text-gray-400 shrink-0 font-medium">
                    {formatRelativeTime(item.createdAt)}
                  </span>
                </div>

                <p className="text-xs text-dash-textSecondary mt-0.5 leading-snug line-clamp-2">
                  {item.message}
                </p>

                {item.link && (
                  <Link
                    href={item.link}
                    onClick={(e) => {
                      e.stopPropagation();
                      onMarkItemAsRead(item.id);
                      onClose();
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-600 hover:underline mt-1.5"
                  >
                    <span>View Details</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                )}
              </div>

              {!item.isRead && (
                <span className="w-2 h-2 rounded-full bg-brand-500 shrink-0 mt-1.5" />
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-2.5 bg-[#FBFBFC] border-t border-dash-border/60 text-center">
        <span className="text-[11px] text-gray-400 font-medium">
          Live Real-Time Activity Alerts
        </span>
      </div>
    </div>
  );
}
