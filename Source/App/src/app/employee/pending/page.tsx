"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Clock,
  Briefcase,
  AlertCircle,
  Calendar,
  Cloud,
  ExternalLink,
  Edit3,
  CheckCircle2,
  ListTodo,
  Check,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatusBadge, PriorityBadge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { formatDate } from "@/lib/utils";
import { UserSession } from "@/types";

export default function EmployeePendingUpdatesPage() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Update Modal State
  const [activeProject, setActiveProject] = useState<any | null>(null);
  const [progressVal, setProgressVal] = useState<number>(0);
  const [note, setNote] = useState("");
  const [attachments, setAttachments] = useState("");
  const [markForReview, setMarkForReview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState("");
  const [updateError, setUpdateError] = useState("");

  const loadData = () => {
    setLoading(true);
    fetch("/api/employee/dashboard")
      .then((r) => r.json())
      .then((data) => {
        setProjects(data.projects || []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.user) setUser(d.user);
      });
    loadData();
  }, []);

  const openUpdateModal = (p: any) => {
    setActiveProject(p);
    setProgressVal(p.progress);
    setNote("");
    setAttachments("");
    setMarkForReview(p.progress >= 100);
    setUpdateSuccess("");
    setUpdateError("");
  };

  const handleToggleTask = async (projectId: string, taskId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCompleted: !currentStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to toggle task");

      setProjects((prev) =>
        prev.map((proj) => {
          if (proj.id !== projectId) return proj;
          const updatedTasks = proj.tasks.map((t: any) =>
            t.id === taskId ? { ...t, isCompleted: !currentStatus } : t
          );
          return {
            ...proj,
            progress: data.projectProgress ?? proj.progress,
            tasks: updatedTasks,
          };
        })
      );
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handlePostUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject) return;
    setSubmitting(true);
    setUpdateError("");
    setUpdateSuccess("");

    try {
      const res = await fetch("/api/updates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: activeProject.id,
          progress: Number(progressVal),
          note,
          attachments: attachments.trim() || undefined,
          status: markForReview ? "PENDING_REVIEW" : "IN_PROGRESS",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to post update");

      setUpdateSuccess("Progress logged successfully!");
      setTimeout(() => {
        setActiveProject(null);
        loadData();
      }, 1000);
    } catch (err: any) {
      setUpdateError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-dash-bg flex items-center justify-center">
        <div className="text-xs font-bold text-gray-400">Loading Pending Tasks...</div>
      </div>
    );
  }

  // Filter projects needing updates: NOT_STARTED, IN_PROGRESS (<100%), or REVISION_REQUESTED
  const pendingProjects = projects.filter(
    (p) =>
      p.status === "NOT_STARTED" ||
      p.status === "REVISION_REQUESTED" ||
      (p.status === "IN_PROGRESS" && p.progress < 100)
  );

  return (
    <AppLayout user={user} title="Pending Updates">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-dash-textPrimary tracking-tight">
          Pending Updates
        </h1>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-gray-400">
          Loading pending assignments...
        </div>
      ) : pendingProjects.length === 0 ? (
        <Card className="py-16 text-center">
          <CheckCircle2 className="w-12 h-12 text-status-completed mx-auto mb-3" />
          <h3 className="text-sm font-bold text-dash-textPrimary">
            All Caught Up!
          </h3>
          <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
            You have no pending project updates right now. All ongoing projects are up to date.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {pendingProjects.map((p) => {
            const isOverdue = new Date(p.deadline) < new Date();
            const isRevision = p.status === "REVISION_REQUESTED";
            const latestApproval = p.approvals?.[0];

            return (
              <Card
                key={p.id}
                className={`hover:shadow-dashHover transition-all flex flex-col justify-between ${
                  isRevision ? "border-amber-300 bg-amber-50/20" : ""
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="font-mono text-xs font-bold text-brand-600 bg-blue-50 px-2.5 py-0.5 rounded">
                      {p.code}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <PriorityBadge priority={p.priority} />
                      <StatusBadge status={p.status} />
                    </div>
                  </div>

                  {isRevision && latestApproval?.feedback && (
                    <div className="mb-3 p-2.5 rounded-smDash bg-amber-50 border border-amber-200 text-xs text-amber-900">
                      <strong className="block font-bold text-[11px] uppercase tracking-wider text-amber-700">
                        CEO Revision Request:
                      </strong>
                      <span className="mt-0.5 block">{latestApproval.feedback}</span>
                    </div>
                  )}

                  <h3 className="text-base font-bold text-dash-textPrimary mb-1.5 line-clamp-1">
                    {p.title}
                  </h3>
                  <p className="text-xs text-dash-textSecondary line-clamp-2 mb-4 leading-relaxed">
                    {p.summary}
                  </p>

                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs font-semibold text-gray-500 mb-1.5">
                      <span>Current Progress</span>
                      <span className="font-bold text-brand-600">{p.progress}%</span>
                    </div>
                    <ProgressBar value={p.progress} size="md" />
                  </div>

                  {/* Milestones checklist */}
                  {p.tasks && p.tasks.length > 0 && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-dash-border/60">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-dash-textPrimary uppercase tracking-wider flex items-center gap-1">
                          <ListTodo className="w-3.5 h-3.5 text-brand-500" />
                          Milestones ({p.tasks.filter((t: any) => t.isCompleted).length}/{p.tasks.length})
                        </span>
                        <span className="text-[10px] text-gray-400">Click to toggle</span>
                      </div>
                      <div className="space-y-1.5">
                        {p.tasks.map((task: any) => (
                          <div
                            key={task.id}
                            onClick={() => handleToggleTask(p.id, task.id, task.isCompleted)}
                            className="flex items-center gap-2 p-1.5 rounded hover:bg-white cursor-pointer transition-colors text-xs select-none"
                          >
                            <div
                              className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                task.isCompleted
                                  ? "bg-status-completed border-status-completed text-white"
                                  : "border-gray-300 bg-white"
                              }`}
                            >
                              {task.isCompleted && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <span
                              className={`font-medium flex-1 truncate ${
                                task.isCompleted ? "line-through text-gray-400" : "text-dash-textPrimary"
                              }`}
                            >
                              {task.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-dash-textSecondary pt-3 border-t border-dash-border/40 mb-4">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      <span className={isOverdue ? "text-status-delayed font-bold" : ""}>
                        Due: {formatDate(p.deadline)}
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                      Role: {p.memberRole}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 pt-2">
                  {p.driveFolderUrl ? (
                    <a
                      href={p.driveFolderUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-50 text-brand-600 hover:bg-brand-500 hover:text-white transition-colors font-bold text-xs shadow-xs"
                    >
                      <Cloud className="w-3.5 h-3.5" />
                      <span>Drive Folder</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span />
                  )}

                  <Button
                    size="sm"
                    onClick={() => openUpdateModal(p)}
                    icon={<Edit3 className="w-3.5 h-3.5" />}
                  >
                    Post Progress
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Progress Update Modal */}
      <Modal
        isOpen={!!activeProject}
        onClose={() => setActiveProject(null)}
        title="Post Progress Update"
        description={`${activeProject?.code}: ${activeProject?.title}`}
      >
        {updateError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-smDash flex items-start gap-2 text-xs text-status-delayed font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{updateError}</span>
          </div>
        )}

        {updateSuccess && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-smDash text-xs text-status-completed font-semibold">
            {updateSuccess}
          </div>
        )}

        <form onSubmit={handlePostUpdate} className="space-y-5">
          {activeProject?.driveFolderUrl && (
            <div className="p-3 bg-blue-50/70 border border-blue-200/60 rounded-smDash flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-dash-textSecondary">
                <Cloud className="w-4 h-4 text-brand-500 shrink-0" />
                <span className="font-medium">Project Cloud Drive</span>
              </div>
              <a
                href={activeProject.driveFolderUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:underline"
              >
                <span>Open in Drive</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-dash-textPrimary uppercase tracking-wider">
                Overall Progress
              </label>
              <span className="text-sm font-extrabold text-brand-600">
                {progressVal}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={progressVal}
              onChange={(e) => {
                const val = Number(e.target.value);
                setProgressVal(val);
                if (val >= 100) setMarkForReview(true);
              }}
              className="w-full accent-brand-500 cursor-pointer h-2 bg-gray-200 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-dash-textPrimary mb-1.5 uppercase tracking-wider">
              Work Completed / Note *
            </label>
            <textarea
              required
              rows={3}
              placeholder="What tasks were finished? Any blockers or notes for CEO review..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-[#F5F6FA] text-sm text-dash-textPrimary rounded-smDash p-3 border border-dash-border/80 focus:outline-none focus:border-brand-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-dash-textPrimary mb-1.5 uppercase tracking-wider">
              Cloud Deliverable / Research Link (Optional)
            </label>
            <input
              type="url"
              placeholder="https://drive.google.com/..."
              value={attachments}
              onChange={(e) => setAttachments(e.target.value)}
              className="w-full bg-[#F5F6FA] text-xs font-mono text-dash-textPrimary rounded-smDash p-3 border border-dash-border/80 focus:outline-none focus:border-brand-500 font-medium"
            />
          </div>

          <div className="p-3 bg-gray-50 rounded-smDash border border-dash-border/60 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-dash-textPrimary block">
                Submit for CEO Review & Approval
              </span>
              <span className="text-[11px] text-dash-textSecondary">
                Places project in the CEO sign-off queue
              </span>
            </div>
            <input
              type="checkbox"
              checked={markForReview}
              onChange={(e) => setMarkForReview(e.target.checked)}
              className="w-4 h-4 rounded text-brand-500 focus:ring-brand-500 border-gray-300"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setActiveProject(null)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" loading={submitting}>
              Submit Progress Log
            </Button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
