"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  CheckCircle2,
  Users,
  LogOut,
  FolderPlus,
  Clock,
  Briefcase,
} from "lucide-react";
import { Role } from "@/types";
import { cn } from "@/lib/utils";

interface SidebarProps {
  role: Role;
  onLogout?: () => void;
}

export function Sidebar({ role, onLogout }: SidebarProps) {
  const pathname = usePathname();

  const ceoNav = [
    { name: "Dashboard", href: "/ceo", icon: LayoutDashboard },
    { name: "All Projects", href: "/ceo/projects", icon: FolderKanban },
    { name: "Assign Project", href: "/ceo/assign", icon: FolderPlus },
    { name: "Approval Queue", href: "/ceo/approvals", icon: CheckCircle2 },
    { name: "Team Directory", href: "/ceo/employees", icon: Users },
  ];

  const employeeNav = [
    { name: "Dashboard", href: "/employee", icon: LayoutDashboard },
    { name: "My Projects", href: "/employee/projects", icon: Briefcase },
    { name: "Pending Updates", href: "/employee/pending", icon: Clock },
    { name: "Completed History", href: "/employee/history", icon: CheckCircle2 },
  ];

  const items = role === "CEO" ? ceoNav : employeeNav;

  return (
    <aside className="w-64 bg-white border-r border-dash-border/60 flex flex-col h-screen fixed left-0 top-0 z-30 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-dash-border/60 gap-3">
        <div className="w-10 h-10 rounded-full overflow-hidden shadow-md shrink-0 bg-[#24282B] border-2 border-amber-400/80 ring-1 ring-amber-500/30 flex items-center justify-center p-0.5">
          <img
            src="/logo-circle.png"
            alt="Epic Craft Golden Medallion Logo"
            className="w-full h-full object-cover"
          />
        </div>
        <div>
          <h1 className="font-extrabold text-base tracking-tight text-dash-textPrimary leading-none">
            Epic Craft
          </h1>
          <span className="text-[11px] font-semibold text-brand-500 uppercase tracking-wider">
            {role} Portal
          </span>
        </div>
      </div>

      {/* Nav List */}
      <div className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
          Main Menu
        </div>
        {items.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/ceo" && item.href !== "/employee" && pathname?.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3.5 py-2.5 rounded-smDash text-sm font-semibold transition-all duration-150",
                isActive
                  ? "bg-brand-500 text-white shadow-sm"
                  : "text-dash-textSecondary hover:bg-gray-50 hover:text-dash-textPrimary"
              )}
            >
              <Icon className={cn("w-5 h-5", isActive ? "text-white" : "text-gray-400")} />
              {item.name}
            </Link>
          );
        })}
      </div>

      {/* Footer / Logout */}
      <div className="p-4 border-t border-dash-border/60">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-smDash text-sm font-semibold text-status-delayed hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-5 h-5 text-status-delayed" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
