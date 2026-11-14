"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  FolderKanban,
  Search,
  Filter,
  ExternalLink,
  PlusCircle,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/Card";
import { StatusBadge, PriorityBadge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { AvatarGroup } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";
import { UserSession } from "@/types";

export default function CeoProjectsPage() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("ALL");
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("ALL");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.user) setUser(d.user);
      });
  }, []);

  const loadProjects = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (activeTab !== "ALL") params.set("status", activeTab);
    if (priorityFilter !== "ALL") params.set("priority", priorityFilter);
    if (search.trim()) params.set("search", search.trim());

    fetch(`/api/projects?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setProjects(data.projects || []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProjects();
  }, [activeTab, priorityFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadProjects();
  };

  const tabs = [
    { id: "ALL", label: "All Projects" },
    { id: "IN_PROGRESS", label: "In Progress" },
    { id: "PENDING_REVIEW", label: "Pending Review" },
    { id: "COMPLETED", label: "Completed" },
    { id: "NOT_STARTED", label: "Not Started" },
  ];

  if (!user) {
    return (
      <div className="min-h-screen bg-dash-bg flex items-center justify-center">
        <div className="text-xs font-bold text-gray-400">Loading Projects Hub...</div>
      </div>
    );
  }

  return (
    <AppLayout user={user} title="All Company Projects">
      {/* Top Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-dash-textPrimary tracking-tight">
            Projects Central Hub
          </h1>
          <p className="text-xs text-dash-textSecondary mt-0.5">
            Monitor real-time progress, deadlines, and drive assets
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/api/reports/export?format=csv"
            download
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-dash-border/80 rounded-smDash transition-colors shadow-sm"
          >
            <FileText className="w-4 h-4 text-gray-500" />
            <span>Export Report (CSV)</span>
          </a>
          <Link href="/ceo/assign">
            <Button icon={<PlusCircle className="w-4 h-4" />}>
              Assign New Project
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabs & Filters Bar (DashStack Style) */}
      <Card className="p-4 mb-6">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto w-full lg:w-auto pb-2 lg:pb-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-brand-500 text-white shadow-sm"
                    : "text-dash-textSecondary hover:bg-gray-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search & Priority Select */}
          <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-[#F5F6FA] text-xs font-medium text-dash-textPrimary rounded-smDash px-3 py-2 border border-dash-border/60 focus:outline-none"
            >
              <option value="ALL">All Priorities</option>
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>

            <form onSubmit={handleSearchSubmit} className="relative w-56">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search projects..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#F5F6FA] text-xs text-dash-textPrimary rounded-smDash pl-8 pr-3 py-2 border border-dash-border/60 focus:outline-none"
              />
            </form>
          </div>
        </div>
      </Card>

      {/* Projects Table */}
      <Card>
        {loading ? (
          <div className="py-12 text-center text-xs text-gray-400 font-medium">
            Loading company projects...
          </div>
        ) : projects.length === 0 ? (
          <div className="py-16 text-center">
            <FolderKanban className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-dash-textPrimary">No projects found</h3>
            <p className="text-xs text-gray-400 mt-1 mb-4 max-w-sm mx-auto">
              {search || activeTab !== "ALL" || priorityFilter !== "ALL"
                ? "No projects match the selected filters or search query."
                : "No projects created yet. Start by assigning your first project."}
            </p>
            <Link href="/ceo/assign">
              <Button size="sm" icon={<PlusCircle className="w-4 h-4" />}>
                + Assign Project
              </Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-dash-border/60 text-gray-400 uppercase tracking-wider font-bold">
                  <th className="pb-3 pl-3">Code</th>
                  <th className="pb-3">Project Title & Summary</th>
                  <th className="pb-3">Assignees</th>
                  <th className="pb-3 w-40">Live Progress</th>
                  <th className="pb-3">Deadline</th>
                  <th className="pb-3">Priority</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 pr-3 text-right">Drive Workspace</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dash-border/30">
                {projects.map((p) => {
                  const isOverdue =
                    p.status !== "COMPLETED" && new Date(p.deadline) < new Date();
                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-gray-50/80 transition-colors group"
                    >
                      <td className="py-4 pl-3 font-mono font-bold text-gray-600">
                        {p.code}
                      </td>
                      <td className="py-4 max-w-[280px]">
                        <div className="font-bold text-sm text-dash-textPrimary group-hover:text-brand-500 transition-colors">
                          {p.title}
                        </div>
                        <p className="text-[11px] text-dash-textSecondary line-clamp-1 mt-0.5">
                          {p.summary}
                        </p>
                      </td>
                      <td className="py-4">
                        <AvatarGroup
                          users={p.members.map((m: any) => ({
                            name: m.user.name,
                            email: m.user.email,
                          }))}
                        />
                      </td>
                      <td className="py-4">
                        <ProgressBar value={p.progress} size="md" />
                      </td>
                      <td className="py-4">
                        <div
                          className={`font-semibold ${
                            isOverdue ? "text-status-delayed" : "text-dash-textPrimary"
                          }`}
                        >
                          {formatDate(p.deadline)}
                        </div>
                        {isOverdue && (
                          <span className="text-[10px] text-status-delayed font-bold flex items-center gap-0.5">
                            <AlertCircle className="w-3 h-3" /> Overdue
                          </span>
                        )}
                      </td>
                      <td className="py-4">
                        <PriorityBadge priority={p.priority} />
                      </td>
                      <td className="py-4">
                        <StatusBadge status={p.status} />
                      </td>
                      <td className="py-4 pr-3 text-right">
                        {p.driveFolderUrl ? (
                          <a
                            href={p.driveFolderUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-50 text-brand-600 hover:bg-brand-500 hover:text-white transition-colors font-semibold text-xs shadow-sm"
                          >
                            <span>Drive Folder</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-gray-400">Not provisioned</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </AppLayout>
  );
}
