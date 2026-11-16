"use client";

import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  Clock,
  RotateCcw,
  Check,
  ExternalLink,
  MessageSquare,
  AlertCircle,
  FileCheck,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { AvatarGroup } from "@/components/ui/Avatar";
import { formatDate } from "@/lib/utils";
import { UserSession } from "@/types";

export default function CeoApprovalsPage() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [pendingProjects, setPendingProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal Review State
  const [activeProject, setActiveProject] = useState<any | null>(null);
  const [decision, setDecision] = useState<"APPROVED" | "REVISION_REQUESTED">("APPROVED");
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  const loadApprovals = () => {
    setLoading(true);
    fetch("/api/approvals")
      .then((r) => r.json())
      .then((d) => setPendingProjects(d.projects || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.user) setUser(d.user);
      });
    loadApprovals();
  }, []);

  const handleOpenReview = (proj: any, defaultDecision: "APPROVED" | "REVISION_REQUESTED") => {
    setActiveProject(proj);
    setDecision(defaultDecision);
    setFeedback(defaultDecision === "APPROVED" ? "Approved! Excellent work." : "");
    setStatusMsg("");
  };

  const submitReview = async () => {
    if (!activeProject) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: activeProject.id,
          decision,
          feedback,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit review");

      setStatusMsg(data.message);
      setTimeout(() => {
        setActiveProject(null);
        loadApprovals();
      }, 1000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-dash-bg flex items-center justify-center">
        <div className="text-xs font-bold text-gray-400">Loading Approvals Queue...</div>
      </div>
    );
  }

  return (
    <AppLayout user={user} title="Approvals">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-dash-textPrimary tracking-tight">
          Approvals
        </h1>
      </div>

      <Card>
        {loading ? (
          <div className="py-12 text-center text-xs text-gray-400 font-medium">
            Loading approval queue...
          </div>
        ) : pendingProjects.length === 0 ? (
          <div className="py-16 text-center">
            <CheckCircle2 className="w-12 h-12 text-status-completed mx-auto mb-3" />
            <h3 className="text-sm font-bold text-dash-textPrimary">All caught up!</h3>
            <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
              There are no projects currently waiting for review or approval.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-dash-border/40">
            {pendingProjects.map((p) => {
              const latestUpdate = p.updates?.[0];
              return (
                <div key={p.id} className="p-6 hover:bg-gray-50/60 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs font-bold text-brand-600 bg-blue-50 px-2 py-0.5 rounded">
                          {p.code}
                        </span>
                        <span className="text-xs font-semibold text-status-pending bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                          Pending Approval
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-dash-textPrimary">
                        {p.title}
                      </h3>
                      <p className="text-xs text-dash-textSecondary mt-1 line-clamp-2">
                        {p.summary}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {p.driveFolderUrl && (
                        <a
                          href={p.driveFolderUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-smDash bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-gray-700 inline-flex items-center gap-1.5"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Inspect Files</span>
                        </a>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenReview(p, "REVISION_REQUESTED")}
                        icon={<RotateCcw className="w-3.5 h-3.5 text-status-delayed" />}
                      >
                        Request Revision
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleOpenReview(p, "APPROVED")}
                        className="bg-status-completed hover:bg-emerald-600"
                        icon={<Check className="w-3.5 h-3.5" />}
                      >
                        Approve Project
                      </Button>
                    </div>
                  </div>

                  {/* Submission Note */}
                  {latestUpdate && (
                    <div className="mt-3 p-3 bg-white border border-dash-border/60 rounded-md">
                      <div className="flex items-center justify-between text-[11px] font-bold text-gray-500 mb-1">
                        <span>Latest Update from {latestUpdate.user.name}</span>
                        <span>{formatDate(latestUpdate.createdAt)}</span>
                      </div>
                      <p className="text-xs text-dash-textPrimary italic">
                        "{latestUpdate.note}"
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Review Modal */}
      <Modal
        isOpen={!!activeProject}
        onClose={() => setActiveProject(null)}
        title={decision === "APPROVED" ? "Approve Completed Project" : "Request Revisions"}
        description={`Project: ${activeProject?.code} - ${activeProject?.title}`}
      >
        <div className="space-y-4">
          {statusMsg ? (
            <div className="p-4 bg-emerald-50 text-status-completed rounded-md text-xs font-bold text-center">
              {statusMsg}
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-bold text-dash-textPrimary mb-1 uppercase tracking-wider">
                  Review Feedback & Note to Team
                </label>
                <textarea
                  rows={4}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder={
                    decision === "APPROVED"
                      ? "Optional praise, comments, or archival notes..."
                      : "Specify what changes or corrections are needed before approval..."
                  }
                  className="w-full bg-[#F5F6FA] text-sm text-dash-textPrimary rounded-smDash p-3 border border-dash-border/80 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <Button
                  variant="outline"
                  onClick={() => setActiveProject(null)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={submitReview}
                  disabled={submitting}
                  className={
                    decision === "APPROVED"
                      ? "bg-status-completed hover:bg-emerald-600 text-white"
                      : "bg-status-delayed hover:bg-red-700 text-white"
                  }
                >
                  {submitting
                    ? "Submitting..."
                    : decision === "APPROVED"
                    ? "Confirm Approval"
                    : "Send Revision Request"}
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </AppLayout>
  );
}
