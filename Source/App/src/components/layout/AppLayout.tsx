"use client";

import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { UserSession } from "@/types";

interface AppLayoutProps {
  user: UserSession;
  title?: string;
  children: React.ReactNode;
}

export function AppLayout({ user, title, children }: AppLayoutProps) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      // ignore
    }
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-dash-bg flex">
      <Sidebar role={user.role} onLogout={handleLogout} />
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        <Header
          user={user}
          title={title}
          unreadNotifications={2}
          onOpenNotifications={() => setNotificationsOpen(!notificationsOpen)}
        />
        <main className="flex-1 pt-24 px-8 pb-12 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
