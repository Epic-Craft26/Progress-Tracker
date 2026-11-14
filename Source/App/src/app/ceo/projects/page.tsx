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
  Cloud,
  Copy,
  Check,
  Users,
  Eye,
  Calendar,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/Card";
import { StatusBadge, PriorityBadge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Avatar, AvatarGroup } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { formatDate } from "@/lib/utils";
import { UserSession } from "@/types";

export default function CeoProjectsPage() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("ALL");
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [copiedEmails, setCopiedEmails] = useState(false);

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
                        <div className="inline-flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedProject(p)}
                            icon={<Eye className="w-3.5 h-3.5" />}
                          >
                            Track & Research
                          </Button>
                          {p.driveFolderUrl && (
                            <a
                              href={p.driveFolderUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-50 text-brand-600 hover:bg-brand-500 hover:text-white transition-colors font-semibold text-xs shadow-sm"
                            >
                              <span>Drive</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Project Cloud & Contributor Tracking Modal */}
      <Modal
        isOpen={!!selectedProject}
        onClose={() => setSelectedProject(null)}
        title={selectedProject ? `${selectedProject.code}: ${selectedProject.title}` : ""}
        maxWidth="lg"
      >
        {selectedProject && (
          <div className="space-y-6">
            {/* Top Badges & Status */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-dash-border/60">
              <div className="flex items-center gap-2">
                <PriorityBadge priority={selectedProject.priority} />
                <StatusBadge status={selectedProject.status} />
                <span className="text-xs text-gray-500 font-medium">
                  Due {formatDate(selectedProject.deadline)}
                </span>
              </div>
              <div className="text-sm font-extrabold text-brand-600">
                {selectedProject.progress}% Complete
              </div>
            </div>

            {/* Scope / Summary */}
            <div>
              <h4 className="text-xs font-bold text-dash-textPrimary uppercase tracking-wider mb-1">
                Project Scope & Deliverables
              </h4>
              <p className="text-xs text-dash-textSecondary leading-relaxed bg-[#F8F9FC] p-3 rounded-smDash border border-dash-border/60">
                {selectedProject.summary}
              </p>
            </div>

            {/* Google Drive Cloud Workspace Hub */}
            <div className="p-4 bg-gradient-to-br from-blue-50/80 to-indigo-50/40 rounded-smDash border border-blue-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Cloud className="w-5 h-5 text-brand-500" />
                  <h4 className="text-xs font-bold text-dash-textPrimary uppercase tracking-wider">
                    Google Drive Cloud Storage
                  </h4>
                </div>
                {selectedProject.driveFolderUrl && (
                  <a
                    href={selectedProject.driveFolderUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-brand-500 text-white text-xs font-bold hover:bg-brand-600 transition-colors shadow-xs"
                  >
                    <span>Open Drive Workspace</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              <p className="text-xs text-dash-textSecondary leading-relaxed">
                All research files, Figma wireframes, client assets, and final deliverables for this project are stored in this Google Drive workspace.
              </p>

              {/* Team Permissions Copy Helper */}
              {selectedProject.members?.length > 0 && (
                <div className="mt-3 pt-3 border-t border-blue-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="text-[11px] text-gray-600">
                    <strong>Drive Share List:</strong>{" "}
                    {selectedProject.members.map((m: any) => m.user.email).join(", ")}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const emails = selectedProject.members.map((m: any) => m.user.email).join(", ");
                      navigator.clipboard.writeText(emails);
                      setCopiedEmails(true);
                      setTimeout(() => setCopiedEmails(false), 2000);
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-600 bg-white px-2.5 py-1 rounded border border-blue-200 shrink-0 self-start sm:self-auto hover:bg-blue-50 transition-colors"
                  >
                    {copiedEmails ? <Check className="w-3 h-3 text-status-completed" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedEmails ? "Copied!" : "Copy Emails for Drive"}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Contributor Tracking & Breakdown */}
            <div>
              <h4 className="text-xs font-bold text-dash-textPrimary uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Team Contributors ({selectedProject.members?.length || 0})</span>
                <span className="text-[11px] text-gray-400 font-normal">Active contributors on this project</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedProject.members?.map((m: any) => {
                  const memberUpdates = selectedProject.updates?.filter((u: any) => u.user.id === m.user.id) || [];
                  const isLead = m.memberRole === "LEAD";
                  return (
                    <div
                      key={m.id || m.user.id}
                      className="p-3 bg-white rounded-smDash border border-dash-border/80 flex items-center justify-between gap-3 shadow-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar name={m.user.name} size="md" />
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-dash-textPrimary truncate flex items-center gap-1.5">
                            <span>{m.user.name}</span>
                            <span
                              className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded ${
                                isLead ? "bg-brand-500 text-white" : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {m.memberRole}
                            </span>
                          </div>
                          <div className="text-[11px] text-gray-400 truncate font-medium">
                            {m.user.email}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-bold text-brand-600 block">
                          {memberUpdates.length} logs
                        </span>
                        <span className="text-[10px] text-gray-400">contributions</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Cloud Research Submissions & Work Logs */}
            <div>
              <h4 className="text-xs font-bold text-dash-textPrimary uppercase tracking-wider mb-2">
                Cloud Research Submissions & Activity Log
              </h4>
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {!selectedProject.updates || selectedProject.updates.length === 0 ? (
                  <div className="py-6 text-center text-xs text-gray-400 bg-gray-50 rounded-smDash border border-dashed border-dash-border/60">
                    No milestone logs or cloud research links submitted yet.
                  </div>
                ) : (
                  selectedProject.updates.map((u: any) => (
                    <div
                      key={u.id}
                      className="p-3 rounded-smDash bg-[#FBFBFC] border border-dash-border/60 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar name={u.user.name} size="sm" />
                          <span className="font-bold text-dash-textPrimary">{u.user.name}</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-brand-600">
                            {u.progress}% milestone
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-400">
                          {new Date(u.createdAt).toLocaleDateString([], {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="text-dash-textSecondary pl-8">{u.note}</p>
                      {u.attachments && (
                        <div className="pl-8 pt-1">
                          <a
                            href={u.attachments}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-600 hover:underline bg-white px-2 py-0.5 rounded border border-blue-200"
                          >
                            <Cloud className="w-3 h-3 text-brand-500" />
                            <span>Cloud Research Link</span>
                            <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
                          </a>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </AppLayout>
  );
}
