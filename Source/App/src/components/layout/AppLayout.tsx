"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { NotificationDropdown, NotificationItem } from "./NotificationDropdown";
import { UserSession } from "@/types";

interface AppLayoutProps {
  user: UserSession;
  title?: string;
  children: React.ReactNode;
}

export function AppLayout({ user, title, children }: AppLayoutProps) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 20000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAllAsRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (e) {}
  };

  const handleMarkItemAsRead = async (id: string) => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (e) {}
  };

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
          unreadNotifications={unreadCount}
          onOpenNotifications={() => setNotificationsOpen(!notificationsOpen)}
        >
          <NotificationDropdown
            isOpen={notificationsOpen}
            onClose={() => setNotificationsOpen(false)}
            notifications={notifications}
            unreadCount={unreadCount}
            onMarkAllAsRead={handleMarkAllAsRead}
            onMarkItemAsRead={handleMarkItemAsRead}
          />
        </Header>
        <main className="flex-1 pt-24 px-8 pb-12 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
