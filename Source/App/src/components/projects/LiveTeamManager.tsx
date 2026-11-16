"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  UserMinus,
  Crown,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  HardDrive,
  FolderOpen,
  ArrowRight,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

interface ProjectMemberItem {
  id: string;
  userId: string;
  memberRole: "LEAD" | "CONTRIBUTOR";
  assignedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    designation?: string | null;
    department?: string | null;
    isActive: boolean;
  };
  totalTasks: number;
  pendingTasks: number;
}

interface LiveTeamManagerProps {
  projectId: string;
  projectTitle: string;
  driveFolderId?: string | null;
  driveFolderUrl?: string | null;
  onMembersChange?: () => void;
}

export function LiveTeamManager({
  projectId,
  projectTitle,
  driveFolderId,
  driveFolderUrl,
  onMembersChange,
}: LiveTeamManagerProps) {
  const [members, setMembers] = useState<ProjectMemberItem[]>([]);
  const [allEmployees, setAllEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Add Member State
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState<"CONTRIBUTOR" | "LEAD">("CONTRIBUTOR");

  // Remove Member Modal State
  const [memberToRemove, setMemberToRemove] = useState<ProjectMemberItem | null>(null);
  const [reassignOption, setReassignOption] = useState<"LEAD" | "COLLEAGUE" | "BACKLOG">("LEAD");
  const [reassignTargetId, setReassignTargetId] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [membersRes, employeesRes] = await Promise.all([
        fetch(`/api/projects/${projectId}/members`),
        fetch("/api/employees"),
      ]);

      const membersData = await membersRes.json();
      const employeesData = await employeesRes.json();

      if (membersRes.ok) {
        setMembers(membersData.members || []);
      }
      if (employeesRes.ok) {
        setAllEmployees(employeesData.employees || []);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load team data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      loadData();
    }
  }, [projectId]);

  // Filter available employees who are not yet members
  const availableEmployees = allEmployees.filter(
    (emp) => emp.isActive && !members.some((m) => m.userId === emp.id)
  );

  // Find current Project Lead for quick task reassignment
  const currentLead = members.find((m) => m.memberRole === "LEAD");

  // Add Member Handler
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;

    setActionLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      const res = await fetch(`/api/projects/${projectId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUserId,
          memberRole: selectedRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add member");

      setSuccessMsg(data.message || "Employee successfully assigned to project");
      setSelectedUserId("");
      setSelectedRole("CONTRIBUTOR");
      setShowAddForm(false);
      await loadData();
      if (onMembersChange) onMembersChange();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle Role Handler
  const handleToggleRole = async (member: ProjectMemberItem) => {
    const newRole = member.memberRole === "LEAD" ? "CONTRIBUTOR" : "LEAD";
    setActionLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/projects/${projectId}/members/${member.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberRole: newRole }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update member role");

      setSuccessMsg(`${member.user.name} is now ${newRole === "LEAD" ? "Project Lead" : "Contributor"}`);
      await loadData();
      if (onMembersChange) onMembersChange();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Open Remove Confirmation
  const promptRemoveMember = (member: ProjectMemberItem) => {
    setMemberToRemove(member);
    setError("");
    setSuccessMsg("");

    // Default reassignment target
    if (currentLead && currentLead.userId !== member.userId) {
      setReassignOption("LEAD");
      setReassignTargetId(currentLead.userId);
    } else {
      const otherMember = members.find((m) => m.userId !== member.userId);
      if (otherMember) {
        setReassignOption("COLLEAGUE");
        setReassignTargetId(otherMember.userId);
      } else {
        setReassignOption("BACKLOG");
        setReassignTargetId("");
      }
    }
  };

  // Execute Remove Member
  const handleConfirmRemove = async () => {
    if (!memberToRemove) return;

    setActionLoading(true);
    setError("");

    try {
      let targetUserId: string | null = null;
      if (memberToRemove.pendingTasks > 0) {
        if (reassignOption === "LEAD" && currentLead && currentLead.userId !== memberToRemove.userId) {
          targetUserId = currentLead.userId;
        } else if (reassignOption === "COLLEAGUE" && reassignTargetId) {
          targetUserId = reassignTargetId;
        }
      }

      const res = await fetch(`/api/projects/${projectId}/members/${memberToRemove.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reassignTasksToUserId: targetUserId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to remove member");

      setSuccessMsg(data.message || `${memberToRemove.user.name} removed from project`);
      setMemberToRemove(null);
      await loadData();
      if (onMembersChange) onMembersChange();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-dash border border-dash-border/80 p-5 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-dash-border/60">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-brand-500" />
            <h3 className="text-sm font-bold text-dash-textPrimary">
              Live Team Assignment ({members.length})
            </h3>
          </div>
          <p className="text-xs text-dash-textSecondary mt-0.5">
            Add or remove employees while the project is active. Changes sync to Google Drive and employee dashboards instantly.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!showAddForm && (
            <Button
              size="sm"
              onClick={() => setShowAddForm(true)}
              icon={<UserPlus className="w-3.5 h-3.5" />}
              disabled={availableEmployees.length === 0}
            >
              Add Employee
            </Button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-smDash flex items-center gap-2 text-xs text-status-delayed font-medium">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-smDash flex items-center gap-2 text-xs text-emerald-800 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Inline Add Employee Form */}
      {showAddForm && (
        <form
          onSubmit={handleAddMember}
          className="mt-4 p-4 rounded-dash bg-[#F9FAFC] border border-brand-500/30 animate-in fade-in space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-dash-textPrimary flex items-center gap-1.5">
              <UserPlus className="w-3.5 h-3.5 text-brand-500" />
              Assign Employee to Live Project
            </span>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-dash-textPrimary uppercase tracking-wider mb-1">
                Select Team Member
              </label>
              <select
                required
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full bg-white text-xs text-dash-textPrimary rounded-smDash px-3 py-2 border border-dash-border/80 focus:outline-none focus:border-brand-500 font-medium"
              >
                <option value="">-- Choose an available employee --</option>
                {availableEmployees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.email}) {emp.designation ? `• ${emp.designation}` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-dash-textPrimary uppercase tracking-wider mb-1">
                Project Role
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as any)}
                className="w-full bg-white text-xs text-dash-textPrimary rounded-smDash px-3 py-2 border border-dash-border/80 focus:outline-none focus:border-brand-500 font-medium"
              >
                <option value="CONTRIBUTOR">Contributor</option>
                <option value="LEAD">Project Lead</option>
              </select>
            </div>
          </div>

          {driveFolderId && (
            <div className="flex items-center gap-2 text-[11px] text-gray-500 bg-amber-50/60 p-2 rounded border border-amber-200/60">
              <HardDrive className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>
                Employee's Google email will automatically be granted Editor access to the project's Google Drive folder.
              </span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAddForm(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              loading={actionLoading}
              disabled={!selectedUserId || actionLoading}
            >
              Assign to Project
            </Button>
          </div>
        </form>
      )}

      {/* Active Team Roster */}
      <div className="mt-4">
        {loading ? (
          <div className="py-8 text-center text-xs text-gray-400 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-brand-500" />
            <span>Loading active team roster...</span>
          </div>
        ) : members.length === 0 ? (
          <div className="py-6 text-center text-xs text-gray-400 bg-gray-50 rounded-dash border border-dashed border-gray-200">
            No employees currently assigned to this project. Click "Add Employee" above.
          </div>
        ) : (
          <div className="divide-y divide-dash-border/50">
            {members.map((member) => {
              const isLead = member.memberRole === "LEAD";
              return (
                <div
                  key={member.id}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50/50 px-2 rounded-smDash transition-colors"
                >
                  {/* Member Info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                        isLead
                          ? "bg-amber-100 text-amber-800 border-2 border-amber-400"
                          : "bg-blue-100 text-brand-700 border border-blue-200"
                      }`}
                    >
                      {member.user.name.charAt(0).toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-dash-textPrimary truncate">
                          {member.user.name}
                        </span>
                        {isLead ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            <Crown className="w-3 h-3 text-amber-600" />
                            Lead
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-600">
                            Contributor
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-dash-textSecondary mt-0.5 truncate">
                        <span>{member.user.email}</span>
                        {member.user.designation && (
                          <>
                            <span>•</span>
                            <span>{member.user.designation}</span>
                          </>
                        )}
                        <span>•</span>
                        <span className={member.pendingTasks > 0 ? "text-brand-600 font-semibold" : "text-gray-400"}>
                          {member.pendingTasks} active milestone{member.pendingTasks === 1 ? "" : "s"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleToggleRole(member)}
                      className={`px-2.5 py-1 text-[11px] font-semibold rounded-smDash border transition-colors ${
                        isLead
                          ? "bg-white text-gray-600 border-gray-200 hover:bg-gray-100"
                          : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                      }`}
                      title={isLead ? "Demote to Contributor" : "Promote to Project Lead"}
                    >
                      {isLead ? "Demote" : "Make Lead"}
                    </button>

                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => promptRemoveMember(member)}
                      className="px-2.5 py-1 text-[11px] font-semibold rounded-smDash bg-red-50 text-status-delayed border border-red-200 hover:bg-red-100 transition-colors flex items-center gap-1"
                      title="Remove from project"
                    >
                      <UserMinus className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Task Reassignment & Removal Modal */}
      {memberToRemove && (
        <Modal
          isOpen={!!memberToRemove}
          onClose={() => setMemberToRemove(null)}
          title={`Remove ${memberToRemove.user.name} from Project?`}
        >
          <div className="space-y-4">
            <div className="p-3 bg-red-50 border border-red-200 rounded-smDash flex items-start gap-2.5 text-xs text-red-900">
              <AlertTriangle className="w-4 h-4 text-status-delayed shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">
                  You are removing {memberToRemove.user.name} ({memberToRemove.user.email}) from {projectTitle}.
                </p>
                <p className="text-[11px] text-red-700 mt-1">
                  They will lose access to this project workspace, and their Google Drive folder permissions will be revoked.
                </p>
              </div>
            </div>

            {/* Task Reassignment Handling */}
            {memberToRemove.pendingTasks > 0 ? (
              <div className="space-y-2.5">
                <label className="block text-xs font-bold text-dash-textPrimary">
                  Milestone Reassignment ({memberToRemove.pendingTasks} pending tasks):
                </label>
                <p className="text-[11px] text-dash-textSecondary">
                  This employee has {memberToRemove.pendingTasks} active milestone tasks. Where would you like to assign them?
                </p>

                <div className="space-y-2 pt-1">
                  {currentLead && currentLead.userId !== memberToRemove.userId && (
                    <label className="flex items-center gap-2 p-2.5 rounded-smDash border border-dash-border/80 hover:bg-gray-50 cursor-pointer text-xs">
                      <input
                        type="radio"
                        name="reassignOption"
                        checked={reassignOption === "LEAD"}
                        onChange={() => setReassignOption("LEAD")}
                        className="accent-brand-500"
                      />
                      <div className="flex-1">
                        <span className="font-semibold text-dash-textPrimary">
                          Reassign to Project Lead ({currentLead.user.name})
                        </span>
                        <span className="block text-[10px] text-gray-500">
                          Recommended: Assigns all pending tasks to the project lead.
                        </span>
                      </div>
                    </label>
                  )}

                  {members.filter((m) => m.userId !== memberToRemove.userId && m.userId !== currentLead?.userId).length > 0 && (
                    <label className="flex items-center gap-2 p-2.5 rounded-smDash border border-dash-border/80 hover:bg-gray-50 cursor-pointer text-xs">
                      <input
                        type="radio"
                        name="reassignOption"
                        checked={reassignOption === "COLLEAGUE"}
                        onChange={() => setReassignOption("COLLEAGUE")}
                        className="accent-brand-500"
                      />
                      <div className="flex-1">
                        <span className="font-semibold text-dash-textPrimary">
                          Reassign to another team member
                        </span>
                        {reassignOption === "COLLEAGUE" && (
                          <select
                            value={reassignTargetId}
                            onChange={(e) => setReassignTargetId(e.target.value)}
                            className="mt-1.5 w-full bg-white text-xs text-dash-textPrimary rounded-smDash px-2.5 py-1.5 border border-dash-border/80"
                          >
                            {members
                              .filter((m) => m.userId !== memberToRemove.userId)
                              .map((m) => (
                                <option key={m.userId} value={m.userId}>
                                  {m.user.name} ({m.memberRole})
                                </option>
                              ))}
                          </select>
                        )}
                      </div>
                    </label>
                  )}

                  <label className="flex items-center gap-2 p-2.5 rounded-smDash border border-dash-border/80 hover:bg-gray-50 cursor-pointer text-xs">
                    <input
                      type="radio"
                      name="reassignOption"
                      checked={reassignOption === "BACKLOG"}
                      onChange={() => setReassignOption("BACKLOG")}
                      className="accent-brand-500"
                    />
                    <div className="flex-1">
                      <span className="font-semibold text-dash-textPrimary">
                        Move to Unassigned Backlog
                      </span>
                      <span className="block text-[10px] text-gray-500">
                        Tasks remain in the project milestone checklist without an assignee.
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-500">
                This employee has no active milestone tasks assigned.
              </p>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-dash-border/60">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMemberToRemove(null)}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                loading={actionLoading}
                onClick={handleConfirmRemove}
              >
                Confirm Removal
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
