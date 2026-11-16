"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Briefcase,
  ExternalLink,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  FolderOpen,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatusBadge, PriorityBadge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import { UserSession } from "@/types";

function EmployeeProjectsContent() {
  const searchParams = useSearchParams();
  const search = searchParams?.get("search") || "";

  const [user, setUser] = useState<UserSession | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.user) setUser(d.user);
      });
  }, []);

  useEffect(() => {
    setLoading(true);
    const url = search ? `/api/projects?search=${encodeURIComponent(search)}` : "/api/projects";
    fetch(url)
      .then((r) => r.json())
      .then((d) => setProjects(d.projects || []))
      .finally(() => setLoading(false));
  }, [search]);

  if (!user) return null;

  return (
    <AppLayout user={user} title="Projects">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-dash-textPrimary tracking-tight">
          My Projects
        </h1>
        {search && (
          <p className="text-xs text-dash-textSecondary mt-0.5">
            Showing search results for &ldquo;{search}&rdquo;
          </p>
        )}
      </div>

      <Card>
        {loading ? (
          <div className="py-12 text-center text-xs text-gray-400">
            Loading your projects...
          </div>
        ) : projects.length === 0 ? (
          <div className="py-16 text-center">
            <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-dash-textPrimary">
              {search ? "No matching projects found" : "No assignments yet"}
            </h3>
            <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
              {search ? "Try searching with a different keyword or project code." : "You haven't been assigned to any projects yet."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-dash-border/60 text-gray-400 uppercase tracking-wider font-bold">
                  <th className="pb-3 pl-3">Code</th>
                  <th className="pb-3">Title & Summary</th>
                  <th className="pb-3 w-40">Progress</th>
                  <th className="pb-3">Deadline</th>
                  <th className="pb-3">Priority</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 pr-3 text-right">Drive & Workspace</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dash-border/30">
                {projects.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-gray-50/80 transition-colors group"
                  >
                    <td className="py-4 pl-3 font-mono font-bold text-brand-600">
                      {p.code}
                    </td>
                    <td className="py-4 max-w-[280px]">
                      <div className="font-bold text-sm text-dash-textPrimary">
                        {p.title}
                      </div>
                      <p className="text-[11px] text-dash-textSecondary line-clamp-1 mt-0.5">
                        {p.summary}
                      </p>
                    </td>
                    <td className="py-4">
                      <ProgressBar value={p.progress} size="md" />
                    </td>
                    <td className="py-4 font-semibold text-dash-textPrimary">
                      {formatDate(p.deadline)}
                    </td>
                    <td className="py-4">
                      <PriorityBadge priority={p.priority} />
                    </td>
                    <td className="py-4">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="py-4 pr-3 text-right">
                      {p.driveFolderUrl && (
                        <a
                          href={p.driveFolderUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-50 text-brand-600 hover:bg-brand-500 hover:text-white transition-colors font-bold text-xs"
                        >
                          <span>Open Drive</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </AppLayout>
  );
}

export default function EmployeeProjectsListPage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs text-gray-400">Loading...</div>}>
      <EmployeeProjectsContent />
    </Suspense>
  );
}
