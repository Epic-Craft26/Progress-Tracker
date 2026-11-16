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
  Trash2,
  Edit3,
  Layers,
  Tag,
  AlertTriangle,
  FolderOpen,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/Card";
import { StatusBadge, PriorityBadge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Avatar, AvatarGroup } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { LiveTeamManager } from "@/components/projects/LiveTeamManager";
import { formatDate } from "@/lib/utils";
import { UserSession } from "@/types";

export default function CeoProjectsPage() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("ALL");
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  // Detail Modal
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [copiedEmails, setCopiedEmails] = useState(false);
  const [isSyncingDrive, setIsSyncingDrive] = useState(false);
  const [syncDriveMsg, setSyncDriveMsg] = useState("");
  const [syncDriveError, setSyncDriveError] = useState("");

  // Delete State
  const [projectToDelete, setProjectToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Edit State
  const [projectToEdit, setProjectToEdit] = useState<any | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editSummary, setEditSummary] = useState("");
  const [editCategory, setEditCategory] = useState("General");
  const [editPriority, setEditPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "URGENT">("MEDIUM");
  const [editStatus, setEditStatus] = useState("NOT_STARTED");
  const [editDeadline, setEditDeadline] = useState("");
  const [editDriveUrl, setEditDriveUrl] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState("");

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
    if (categoryFilter !== "ALL") params.set("category", categoryFilter);
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
  }, [activeTab, priorityFilter, categoryFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadProjects();
  };

  const refreshSelectedProject = async (projectId: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedProject(data.project);
      }
      loadProjects();
    } catch (e) {
      console.error(e);
    }
  };

  // Open Edit Modal
  const openEditModal = (p: any) => {
    setProjectToEdit(p);
    setEditTitle(p.title);
    setEditSummary(p.summary);
    setEditCategory(p.category || "General");
    setEditPriority(p.priority);
    setEditStatus(p.status);
    setEditDeadline(new Date(p.deadline).toISOString().split("T")[0]);
    setEditDriveUrl(p.driveFolderUrl || "");
    setEditError("");
  };

  // Save Edit Handler
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectToEdit) return;
    setIsSavingEdit(true);
    setEditError("");

    try {
      const res = await fetch(`/api/projects/${projectToEdit.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle,
          summary: editSummary,
          category: editCategory,
          priority: editPriority,
          status: editStatus,
          deadline: editDeadline,
          driveFolderUrl: editDriveUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update project");

      // Update selected project if open
      if (selectedProject?.id === projectToEdit.id) {
        setSelectedProject({ ...selectedProject, ...data.project });
      }

      setProjectToEdit(null);
      loadProjects();
    } catch (err: any) {
      setEditError(err.message);
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Google Drive Automated Subfolder Provisioning
  const handleSyncDrive = async (projectId: string) => {
    setIsSyncingDrive(true);
    setSyncDriveMsg("");
    setSyncDriveError("");

    try {
      const res = await fetch(`/api/projects/${projectId}/sync-drive`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create folder on Google Drive");

      setSyncDriveMsg(data.message);
      if (selectedProject?.id === projectId) {
        setSelectedProject((prev: any) => ({
          ...prev,
          driveFolderUrl: data.folderUrl,
        }));
      }
      loadProjects();
    } catch (err: any) {
      setSyncDriveError(err.message);
    } finally {
      setIsSyncingDrive(false);
    }
  };

  // Delete Handler
  const handleDeleteProject = async () => {
    if (!projectToDelete) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/projects/${projectToDelete.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete project");

      if (selectedProject?.id === projectToDelete.id) {
        setSelectedProject(null);
      }
      setProjectToDelete(null);
      loadProjects();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const tabs = [
    { id: "ALL", label: "All Projects" },
    { id: "IN_PROGRESS", label: "In Progress" },
    { id: "PENDING_REVIEW", label: "Pending Review" },
    { id: "COMPLETED", label: "Completed" },
    { id: "NOT_STARTED", label: "Not Started" },
  ];

  const categories = [
    "ALL",
    "General",
    "3D & Animation",
    "Game Development",
    "UI/UX Design",
    "Software Engineering",
    "Research & Docs",
    "Marketing",
  ];

  if (!user) {
    return (
      <div className="min-h-screen bg-dash-bg flex items-center justify-center">
        <div className="text-xs font-bold text-gray-400">Loading Projects Hub...</div>
      </div>
    );
  }

  return (
    <AppLayout user={user} title="Projects">
      {/* Top Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-dash-textPrimary tracking-tight">
            Projects
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/ceo/assign">
            <Button icon={<PlusCircle className="w-4 h-4" />}>
              Create Project
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabs Row */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-dash-border/60 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-smDash text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-brand-500 text-white shadow-xs"
                : "text-dash-textSecondary hover:bg-gray-100 hover:text-dash-textPrimary"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter Bar */}
      <Card className="p-4 mb-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by project code, title, or scope..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#F8F9FC] border border-dash-border/80 rounded-smDash text-xs text-dash-textPrimary placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </form>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Category Filter */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Tag className="w-3.5 h-3.5 text-gray-400" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-[#F8F9FC] border border-dash-border/80 rounded-smDash px-3 py-2 text-xs font-semibold text-dash-textPrimary focus:outline-none focus:border-brand-500"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === "ALL" ? "All Categories" : cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority Filter */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-3.5 h-3.5 text-gray-400" />
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="bg-[#F8F9FC] border border-dash-border/80 rounded-smDash px-3 py-2 text-xs font-semibold text-dash-textPrimary focus:outline-none focus:border-brand-500"
              >
                <option value="ALL">All Priorities</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Projects Table */}
      <Card>
        {loading ? (
          <div className="p-12 text-center text-xs font-bold text-gray-400">
            Fetching project directory...
          </div>
        ) : projects.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-gray-50 text-gray-400 flex items-center justify-center mx-auto">
              <FolderKanban className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-dash-textPrimary">
              No Projects Found
            </h3>
            <p className="text-xs text-dash-textSecondary max-w-sm mx-auto">
              No projects match the current search or filters. You can create a new project anytime.
            </p>
            <div className="pt-2">
              <Link href="/ceo/assign">
                <Button size="sm" icon={<PlusCircle className="w-3.5 h-3.5" />}>
                  Assign New Project
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-dash-border/60 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="pb-3 pl-3">Project Code</th>
                  <th className="pb-3">Title & Category</th>
                  <th className="pb-3">Assigned Team</th>
                  <th className="pb-3 w-32">Progress</th>
                  <th className="pb-3">Deadline</th>
                  <th className="pb-3">Priority</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 pr-3 text-right">Actions</th>
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
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-600">
                            {p.category || "General"}
                          </span>
                          <p className="text-[11px] text-dash-textSecondary line-clamp-1">
                            {p.summary}
                          </p>
                        </div>
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
                        <div className="inline-flex items-center gap-1.5">
                          {/* View Track & Research */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedProject(p)}
                            icon={<Eye className="w-3.5 h-3.5" />}
                          >
                            Track
                          </Button>

                          {/* Edit Project */}
                          <button
                            onClick={() => openEditModal(p)}
                            title="Edit Project Details"
                            className="p-1.5 rounded-md text-gray-500 hover:text-brand-600 hover:bg-blue-50 transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Delete Project */}
                          <button
                            onClick={() => setProjectToDelete(p)}
                            title="Delete Project"
                            className="p-1.5 rounded-md text-gray-400 hover:text-status-delayed hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

                          {/* Open Drive */}
                          {p.driveFolderUrl && (
                            <a
                              href={p.driveFolderUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-blue-50 text-brand-600 hover:bg-brand-500 hover:text-white transition-colors font-semibold text-xs shadow-xs"
                              title="Open Google Drive Workspace"
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
                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-700">
                  {selectedProject.category || "General"}
                </span>
                <PriorityBadge priority={selectedProject.priority} />
                <StatusBadge status={selectedProject.status} />
                <span className="text-xs text-gray-500 font-medium">
                  Due {formatDate(selectedProject.deadline)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openEditModal(selectedProject)}
                  icon={<Edit3 className="w-3.5 h-3.5" />}
                >
                  Edit Project
                </Button>
                <button
                  onClick={() => {
                    setProjectToDelete(selectedProject);
                  }}
                  className="px-2.5 py-1 rounded text-xs font-bold text-status-delayed hover:bg-red-50 transition-colors inline-flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remove
                </button>
              </div>
            </div>

            {/* Scope / Summary */}
            <div>
              <h4 className="text-xs font-bold text-dash-textPrimary uppercase tracking-wider mb-1">
                Scope
              </h4>
              <p className="text-xs text-dash-textSecondary leading-relaxed bg-[#F8F9FC] p-3 rounded-smDash border border-dash-border/60">
                {selectedProject.summary}
              </p>
            </div>

            {/* Google Drive Workspace */}
            <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-500 text-white flex items-center justify-center shadow-xs">
                    <Cloud className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-dash-textPrimary">
                      Google Drive Folder
                    </h4>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSyncDrive(selectedProject.id)}
                    loading={isSyncingDrive}
                    className="text-xs font-bold text-brand-600 bg-white"
                  >
                    Auto-Create Drive Folder
                  </Button>
                  {selectedProject.driveFolderUrl && (
                    <a
                      href={selectedProject.driveFolderUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-500 text-white text-xs font-bold shadow-xs hover:bg-brand-600 transition-colors"
                    >
                      <span>Open Drive</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>

              {syncDriveMsg && (
                <div className="p-2.5 rounded bg-emerald-50 border border-emerald-200 text-xs font-semibold text-status-completed flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  <span>{syncDriveMsg}</span>
                </div>
              )}

              {syncDriveError && (
                <div className="p-2.5 rounded bg-red-50 border border-red-200 text-xs font-semibold text-status-delayed flex items-start gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span>{syncDriveError}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Live Team Assignment Manager (Add / Remove / Reassign while live) */}
            <div>
              <LiveTeamManager
                projectId={selectedProject.id}
                projectTitle={selectedProject.title}
                driveFolderId={selectedProject.driveFolderId}
                driveFolderUrl={selectedProject.driveFolderUrl}
                onMembersChange={() => refreshSelectedProject(selectedProject.id)}
              />
            </div>

            {/* Subtasks / Milestones list if any */}
            {selectedProject.tasks && selectedProject.tasks.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-dash-textPrimary uppercase tracking-wider mb-2">
                  Project Milestones & Deliverables ({selectedProject.tasks.length})
                </h4>
                <div className="space-y-1.5">
                  {selectedProject.tasks.map((task: any) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-2 rounded-smDash bg-gray-50 border border-dash-border/40 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center text-white ${
                            task.isCompleted ? "bg-status-completed" : "bg-gray-300"
                          }`}
                        >
                          {task.isCompleted && <Check className="w-3 h-3" />}
                        </div>
                        <span
                          className={`font-medium ${
                            task.isCompleted
                              ? "line-through text-gray-400"
                              : "text-dash-textPrimary"
                          }`}
                        >
                          {task.title}
                        </span>
                      </div>
                      {task.dueDate && (
                        <span className="text-[10px] text-gray-400">
                          Due {formatDate(task.dueDate)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Progress Activity Feed & Submitted Cloud Links */}
            <div>
              <h4 className="text-xs font-bold text-dash-textPrimary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-brand-500" />
                Work Log & Submitted Cloud Links ({selectedProject.updates?.length || 0})
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
                            <span>Cloud Deliverable / Research Link</span>
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

      {/* Edit Project Modal */}
      <Modal
        isOpen={!!projectToEdit}
        onClose={() => setProjectToEdit(null)}
        title={projectToEdit ? `Edit Project: ${projectToEdit.code}` : "Edit Project"}
        maxWidth="md"
      >
        {projectToEdit && (
          <form onSubmit={handleSaveEdit} className="space-y-4">
            {editError && (
              <div className="p-3 rounded-smDash bg-red-50 border border-red-200 text-status-delayed text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-dash-textPrimary mb-1">
                Project Title *
              </label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                required
                className="w-full px-3 py-2 bg-[#F8F9FC] border border-dash-border/80 rounded-smDash text-xs text-dash-textPrimary focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-dash-textPrimary mb-1">
                  Category *
                </label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F8F9FC] border border-dash-border/80 rounded-smDash text-xs text-dash-textPrimary focus:outline-none focus:border-brand-500"
                >
                  <option value="General">General</option>
                  <option value="3D & Animation">3D & Animation</option>
                  <option value="Game Development">Game Development</option>
                  <option value="UI/UX Design">UI/UX Design</option>
                  <option value="Software Engineering">Software Engineering</option>
                  <option value="Research & Docs">Research & Docs</option>
                  <option value="Marketing">Marketing</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-dash-textPrimary mb-1">
                  Priority *
                </label>
                <select
                  value={editPriority}
                  onChange={(e) => setEditPriority(e.target.value as any)}
                  className="w-full px-3 py-2 bg-[#F8F9FC] border border-dash-border/80 rounded-smDash text-xs text-dash-textPrimary focus:outline-none focus:border-brand-500"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-dash-textPrimary mb-1">
                  Status *
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F8F9FC] border border-dash-border/80 rounded-smDash text-xs text-dash-textPrimary focus:outline-none focus:border-brand-500"
                >
                  <option value="NOT_STARTED">Not Started</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="PENDING_REVIEW">Pending Review</option>
                  <option value="REVISION_REQUESTED">Revision Requested</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-dash-textPrimary mb-1">
                  Target Deadline *
                </label>
                <input
                  type="date"
                  value={editDeadline}
                  onChange={(e) => setEditDeadline(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-[#F8F9FC] border border-dash-border/80 rounded-smDash text-xs text-dash-textPrimary focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-dash-textPrimary mb-1">
                Project Summary / Scope *
              </label>
              <textarea
                value={editSummary}
                onChange={(e) => setEditSummary(e.target.value)}
                rows={3}
                required
                className="w-full px-3 py-2 bg-[#F8F9FC] border border-dash-border/80 rounded-smDash text-xs text-dash-textPrimary focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-dash-textPrimary mb-1">
                Google Drive Workspace URL
              </label>
              <input
                type="url"
                value={editDriveUrl}
                onChange={(e) => setEditDriveUrl(e.target.value)}
                placeholder="https://drive.google.com/..."
                className="w-full px-3 py-2 bg-[#F8F9FC] border border-dash-border/80 rounded-smDash text-xs text-dash-textPrimary focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-dash-border/60">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setProjectToEdit(null)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" loading={isSavingEdit}>
                Save Changes
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!projectToDelete}
        onClose={() => setProjectToDelete(null)}
        title="Remove Project"
        maxWidth="sm"
      >
        {projectToDelete && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-100 text-status-delayed flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <h4 className="font-bold text-red-900 mb-0.5">Permanent Deletion</h4>
                <p className="text-red-700 leading-relaxed">
                  Are you sure you want to remove project{" "}
                  <strong className="font-mono text-red-900">{projectToDelete.code}</strong> (
                  {projectToDelete.title})?
                </p>
                <p className="text-red-600 mt-1 text-[11px]">
                  All associated milestones, contributor assignments, and progress logs will be deleted.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setProjectToDelete(null)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleDeleteProject}
                loading={isDeleting}
                className="bg-status-delayed hover:bg-red-700 text-white"
              >
                Yes, Delete Project
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </AppLayout>
  );
}
