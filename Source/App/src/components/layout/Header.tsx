"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Bell } from "lucide-react";
import { UserSession } from "@/types";
import { Avatar } from "@/components/ui/Avatar";

interface HeaderProps {
  user: UserSession;
  title?: string;
  unreadNotifications?: number;
  onOpenNotifications?: () => void;
  children?: React.ReactNode;
}

export function Header({
  user,
  title = "Dashboard",
  unreadNotifications = 0,
  onOpenNotifications,
  children,
}: HeaderProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const target =
      user.role === "CEO"
        ? `/ceo/projects?search=${encodeURIComponent(searchQuery.trim())}`
        : `/employee/projects?search=${encodeURIComponent(searchQuery.trim())}`;
    router.push(target);
  };

  return (
    <header className="h-16 bg-white border-b border-dash-border/60 fixed top-0 right-0 left-64 z-20 px-8 flex items-center justify-between">
      {/* Title / Breadcrumb */}
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-bold text-dash-textPrimary">{title}</h2>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-5">
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative w-64 hidden md:block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            aria-label="Search projects and tasks"
            placeholder="Search projects, tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#F5F6FA] text-xs text-dash-textPrimary rounded-full pl-9 pr-4 py-2 border border-dash-border/60 focus:outline-none focus:border-brand-500 transition-colors"
          />
        </form>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={onOpenNotifications}
            className="relative p-2 text-gray-500 hover:text-dash-textPrimary hover:bg-gray-50 rounded-full transition-colors focus:outline-none"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadNotifications > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-status-delayed text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                {unreadNotifications > 9 ? "9+" : unreadNotifications}
              </span>
            )}
          </button>
          {children}
        </div>

        {/* User Card */}
        <div className="flex items-center gap-3 pl-3 border-l border-dash-border/60">
          <Avatar name={user.name} size="md" />
          <div className="hidden lg:block text-left">
            <div className="text-xs font-bold text-dash-textPrimary leading-tight">
              {user.name}
            </div>
            <div className="text-[11px] text-gray-400 font-medium">
              {user.email && user.email.includes("@") ? `${user.email} • ` : ""}
              {user.designation || (user.role === "CEO" ? "Leadership" : "Team Member")}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
