"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Briefcase,
  Clock,
  CheckCircle2,
  Award,
  ExternalLink,
  Edit3,
  Calendar,
  AlertCircle,
  FileCheck,
  PlusCircle,
  Cloud,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatusBadge, PriorityBadge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { formatDate } from "@/lib/utils";
import { UserSession } from "@/types";

export default function EmployeeDashboardPage() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [stats, setStats] = useState<any>(null);
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

  const loadDashboard = () => {
    setLoading(true);
    fetch("/api/employee/dashboard")
      .then((r) => r.json())
      .then((data) => {
        setStats(data.stats);
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
    loadDashboard();
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

      setUpdateSuccess("Progress logged and CEO dashboard refreshed!");
      setTimeout(() => {
        setActiveProject(null);
        loadDashboard();
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
        <div className="text-xs font-bold text-gray-400">Loading Employee Workspace...</div>
      </div>
    );
  }

  const activeProjects = projects.filter((p) => p.status === "IN_PROGRESS");

  return (
    <AppLayout user={user} title="My Progress & Assignments">
      {/* KPI Cards Row (Personalized) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="My Active Tasks"
          value={stats?.active || 0}
          trend={{ value: "In progress", isUp: true }}
          icon={<Briefcase className="w-6 h-6 text-brand-500" />}
          iconBgColor="bg-blue-50"
        />
        <MetricCard
          title="Under Review"
          value={stats?.inReview || 0}
          subtitle="Waiting for CEO sign-off"
          icon={<Clock className="w-6 h-6 text-status-pending" />}
          iconBgColor="bg-amber-50"
        />
        <MetricCard
          title="Completed"
          value={stats?.completed || 0}
          subtitle="Successfully archived"
          icon={<CheckCircle2 className="w-6 h-6 text-status-completed" />}
          iconBgColor="bg-emerald-50"
        />
        <MetricCard
          title="On-Time Rate"
          value={`${stats?.onTimeRate ?? 100}%`}
          trend={{ value: "+2%", isUp: true }}
          icon={<Award className="w-6 h-6 text-indigo-500" />}
          iconBgColor="bg-indigo-50"
        />
      </div>

      {/* Active Projects Grid */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-dash-textPrimary">
            My Assigned Projects
          </h2>
          <p className="text-xs text-dash-textSecondary mt-0.5">
            Click "Post Progress" to record work milestones and update the CEO live
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-gray-400">
          Loading your assignments...
        </div>
      ) : activeProjects.length === 0 ? (
        <Card className="py-16 text-center">
          <FileCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-dash-textPrimary">
            No active projects right now
          </h3>
          <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
            You're currently all caught up! New assignments from the CEO will appear
            here immediately.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {activeProjects.map((p) => {
            const isOverdue = new Date(p.deadline) < new Date();
            return (
              <Card
                key={p.id}
                className="hover:shadow-dashHover transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="font-mono text-xs font-bold text-brand-600 bg-blue-50 px-2.5 py-0.5 rounded">
                      {p.code}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <PriorityBadge priority={p.priority} />
                      <StatusBadge status={p.status} />
                    </div>
                  </div>

                  {/* Title & Summary */}
                  <h3 className="text-base font-bold text-dash-textPrimary mb-1.5 line-clamp-1">
                    {p.title}
                  </h3>
                  <p className="text-xs text-dash-textSecondary line-clamp-2 mb-4 leading-relaxed">
                    {p.summary}
                  </p>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs font-semibold text-gray-500 mb-1.5">
                      <span>Live Progress</span>
                      <span className="font-bold text-brand-600">
                        {p.progress}%
                      </span>
                    </div>
                    <ProgressBar value={p.progress} size="md" />
                  </div>

                  {/* Deadline & Role */}
                  <div className="flex items-center justify-between text-xs text-dash-textSecondary pt-3 border-t border-dash-border/40 mb-4">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      <span
                        className={
                          isOverdue ? "text-status-delayed font-bold" : ""
                        }
                      >
                        Due: {formatDate(p.deadline)}
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                      Role: {p.memberRole}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between gap-3 pt-2">
                  {p.driveFolderUrl ? (
                    <a
                      href={p.driveFolderUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-50 text-brand-600 hover:bg-brand-500 hover:text-white transition-colors font-bold text-xs shadow-xs"
                    >
                      <Cloud className="w-3.5 h-3.5" />
                      <span>Open Project Drive</span>
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

      {/* Quick Progress Update Modal */}
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
          {/* Active Google Drive Workspace Info */}
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

          {/* Progress Slider */}
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

          {/* Work Log Note */}
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

          {/* Cloud Research / Drive Deliverable URL */}
          <div>
            <label className="block text-xs font-bold text-dash-textPrimary mb-1.5 uppercase tracking-wider">
              Cloud Research / Drive Deliverable Link (Optional)
            </label>
            <div className="relative">
              <Cloud className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="url"
                placeholder="https://drive.google.com/... or Figma / Google Doc link"
                value={attachments}
                onChange={(e) => setAttachments(e.target.value)}
                className="w-full bg-[#F5F6FA] text-sm text-dash-textPrimary rounded-smDash pl-10 pr-4 py-2.5 border border-dash-border/80 focus:outline-none focus:border-brand-500 font-medium"
              />
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              Store your project research and files on Google Drive and link them here.
            </p>
          </div>

          {/* Mark for Review Checkbox */}
          <div className="flex items-center gap-2 p-3 bg-gray-50 border border-dash-border/60 rounded-smDash">
            <input
              type="checkbox"
              id="markForReview"
              checked={markForReview}
              onChange={(e) => setMarkForReview(e.target.checked)}
              className="w-4 h-4 text-brand-500 rounded accent-brand-500 cursor-pointer"
            />
            <label
              htmlFor="markForReview"
              className="text-xs font-semibold text-dash-textPrimary cursor-pointer"
            >
              Ready for CEO Approval (Marks project as 100% complete)
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-dash-border/40">
            <Button
              type="button"
              variant="outline"
              onClick={() => setActiveProject(null)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving Update..." : "Post Update to Feed"}
            </Button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
