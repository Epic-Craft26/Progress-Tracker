"use client";

import React from "react";
import { Search, Bell } from "lucide-react";
import { UserSession } from "@/types";
import { Avatar } from "@/components/ui/Avatar";

interface HeaderProps {
  user: UserSession;
  title?: string;
  unreadNotifications?: number;
  onOpenNotifications?: () => void;
}

export function Header({
  user,
  title = "Dashboard",
  unreadNotifications = 0,
  onOpenNotifications,
}: HeaderProps) {
  return (
    <header className="h-16 bg-white border-b border-dash-border/60 fixed top-0 right-0 left-64 z-20 px-8 flex items-center justify-between">
      {/* Title / Breadcrumb */}
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-bold text-dash-textPrimary">{title}</h2>
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-status-completed border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-status-completed animate-pulse" />
          Live Connected
        </span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-5">
        {/* Search Input */}
        <div className="relative w-64 hidden md:block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            aria-label="Search projects and tasks"
            placeholder="Search projects, tasks..."
            className="w-full bg-[#F5F6FA] text-xs text-dash-textPrimary rounded-full pl-9 pr-4 py-2 border border-dash-border/60 focus:outline-none focus:border-brand-500 transition-colors"
          />
        </div>

        {/* Notifications */}
        <button
          onClick={onOpenNotifications}
          className="relative p-2 text-gray-500 hover:text-dash-textPrimary hover:bg-gray-50 rounded-full transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          {unreadNotifications > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-status-delayed text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
              {unreadNotifications > 9 ? "9+" : unreadNotifications}
            </span>
          )}
        </button>

        {/* User Card */}
        <div className="flex items-center gap-3 pl-3 border-l border-dash-border/60">
          <Avatar name={user.name} size="md" />
          <div className="hidden lg:block text-left">
            <div className="text-xs font-bold text-dash-textPrimary leading-tight">
              {user.name}
            </div>
            <div className="text-[11px] text-gray-400 font-medium">
              {user.email} • {user.role}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
