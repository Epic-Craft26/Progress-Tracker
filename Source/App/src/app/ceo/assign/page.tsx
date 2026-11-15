"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FolderPlus,
  Users,
  Calendar,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Cloud,
  Copy,
  Check,
  UserPlus,
  ArrowLeft,
  ListPlus,
  Trash2,
  Tag,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { PriorityBadge } from "@/components/ui/Badge";
import { UserSession } from "@/types";

const DEFAULT_MASTER_DRIVE =
  "https://drive.google.com/drive/folders/1BisxzQ0xkseowtbaTe5FNhtTCRE8JFJf?usp=drive_link";

export default function CeoAssignProjectPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserSession | null>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [category, setCategory] = useState("General");
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "URGENT">("MEDIUM");
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [deadline, setDeadline] = useState("");
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [leadId, setLeadId] = useState<string>("");
  const [customDriveUrl, setCustomDriveUrl] = useState(DEFAULT_MASTER_DRIVE);
  const [copiedEmails, setCopiedEmails] = useState(false);

  // Milestones State
  const [tasks, setTasks] = useState<{ title: string; dueDate?: string }[]>([
    { title: "Phase 1: Initial Research & Asset Brief" },
    { title: "Phase 2: Core Development & Implementation" },
    { title: "Phase 3: Final QA & Delivery to Drive" },
  ]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.user) setUser(d.user);
      });

    fetch("/api/employees")
      .then((r) => r.json())
      .then((d) => {
        if (d.employees) setEmployees(d.employees);
      });
  }, []);

  const toggleEmployee = (empId: string) => {
    const exists = selectedEmployees.includes(empId);
    const updated = exists
      ? selectedEmployees.filter((id) => id !== empId)
      : [...selectedEmployees, empId];

    setSelectedEmployees(updated);

    if (exists && leadId === empId) {
      setLeadId(updated[0] || "");
    } else if (!exists && updated.length === 1) {
      setLeadId(empId);
    }
  };

  const copySelectedEmails = () => {
    const emails = employees
      .filter((e) => selectedEmployees.includes(e.id))
      .map((e) => e.email)
      .join(", ");
    if (emails) {
      navigator.clipboard.writeText(emails).catch(() => {});
      setCopiedEmails(true);
      setTimeout(() => setCopiedEmails(false), 2500);
    }
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    setTasks((prev) => [
      ...prev,
      { title: newTaskTitle.trim(), dueDate: newTaskDueDate || undefined },
    ]);
    setNewTaskTitle("");
    setNewTaskDueDate("");
  };

  const handleRemoveTask = (idx: number) => {
    setTasks((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (selectedEmployees.length === 0) {
      setError("Please select at least one employee assignee");
      return;
    }
    if (!deadline) {
      setError("Please select a target completion deadline");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          summary,
          category,
          priority,
          startDate,
          deadline,
          assigneeIds: selectedEmployees,
          leadId: leadId || selectedEmployees[0],
          driveFolderUrl: customDriveUrl,
          tasks: tasks.filter((t) => t.title.trim().length > 0),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create project");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/ceo/projects");
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-dash-bg flex items-center justify-center">
        <div className="text-xs font-bold text-gray-400">Loading Assignment Form...</div>
      </div>
    );
  }

  return (
    <AppLayout user={user} title="Create & Assign Project">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/ceo/projects"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-dash-textSecondary hover:text-brand-500 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to All Projects
          </Link>
        </div>

        <Card className="p-8">
          <div className="flex items-center gap-3 pb-6 mb-6 border-b border-dash-border/60">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-brand-500 flex items-center justify-center shrink-0">
              <FolderPlus className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-dash-textPrimary tracking-tight">
                New Project Assignment
              </h1>
              <p className="text-xs text-dash-textSecondary mt-0.5">
                Provision deliverables, set milestones, and connect team Google Drive workspace
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-smDash flex items-start gap-2.5 text-xs text-status-delayed font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-smDash flex items-start gap-2.5 text-xs text-status-completed font-semibold">
              <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Project created successfully! Milestones assigned and notifications sent. Redirecting...
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-dash-textPrimary mb-1.5 uppercase tracking-wider">
                Project Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 3D Character Rigging & Animation Pack"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-[#F5F6FA] text-sm text-dash-textPrimary rounded-smDash px-4 py-2.5 border border-dash-border/80 focus:outline-none focus:border-brand-500 font-medium"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-dash-textPrimary mb-1.5 uppercase tracking-wider">
                  Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-[#F5F6FA] text-sm text-dash-textPrimary rounded-smDash px-4 py-2.5 border border-dash-border/80 focus:outline-none focus:border-brand-500 font-medium"
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
                <label className="block text-xs font-bold text-dash-textPrimary mb-1.5 uppercase tracking-wider">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e: any) => setPriority(e.target.value)}
                  className="w-full bg-[#F5F6FA] text-sm text-dash-textPrimary rounded-smDash px-4 py-2.5 border border-dash-border/80 focus:outline-none focus:border-brand-500 font-medium"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-dash-textPrimary mb-1.5 uppercase tracking-wider">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-[#F5F6FA] text-sm text-dash-textPrimary rounded-smDash px-4 py-2.5 border border-dash-border/80 focus:outline-none focus:border-brand-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-dash-textPrimary mb-1.5 uppercase tracking-wider">
                  Target Deadline *
                </label>
                <input
                  type="date"
                  required
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full bg-[#F5F6FA] text-sm text-dash-textPrimary rounded-smDash px-4 py-2.5 border border-dash-border/80 focus:outline-none focus:border-brand-500 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-dash-textPrimary mb-1.5 uppercase tracking-wider">
                Project Summary / Scope *
              </label>
              <textarea
                required
                rows={3}
                placeholder="Describe deliverables, required milestones, research parameters, and final output format..."
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="w-full bg-[#F5F6FA] text-sm text-dash-textPrimary rounded-smDash px-4 py-2.5 border border-dash-border/80 focus:outline-none focus:border-brand-500 font-medium"
              />
            </div>

            {/* Milestones / Subtasks Breakdown */}
            <div className="p-4 bg-gray-50/80 rounded-xl border border-dash-border/60 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-dash-textPrimary uppercase tracking-wider flex items-center gap-1.5">
                    <ListPlus className="w-4 h-4 text-brand-500" />
                    Project Milestones & Deliverables ({tasks.length})
                  </h3>
                  <p className="text-[11px] text-dash-textSecondary">
                    Employees check off milestones to automatically drive project progress
                  </p>
                </div>
              </div>

              {/* Task list */}
              <div className="space-y-2">
                {tasks.map((task, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 bg-white rounded-smDash border border-dash-border/60 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-50 text-brand-600 font-bold flex items-center justify-center text-[10px]">
                        {idx + 1}
                      </span>
                      <span className="font-semibold text-dash-textPrimary">{task.title}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {task.dueDate && (
                        <span className="text-[10px] text-gray-400">
                          Due {task.dueDate}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveTask(idx)}
                        className="text-gray-400 hover:text-status-delayed transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Milestone Inline */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
                <input
                  type="text"
                  placeholder="New milestone name (e.g. Concept Sketches, Wireframes)..."
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (newTaskTitle.trim()) {
                        handleAddTask(e);
                      }
                    }
                  }}
                  className="flex-1 w-full bg-white text-xs text-dash-textPrimary rounded-smDash px-3 py-2 border border-dash-border/80 focus:outline-none focus:border-brand-500"
                />
                <input
                  type="date"
                  value={newTaskDueDate}
                  onChange={(e) => setNewTaskDueDate(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (newTaskTitle.trim()) {
                        handleAddTask(e);
                      }
                    }
                  }}
                  className="w-full sm:w-auto bg-white text-xs text-dash-textPrimary rounded-smDash px-3 py-2 border border-dash-border/80 focus:outline-none focus:border-brand-500"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleAddTask}
                  disabled={!newTaskTitle.trim()}
                >
                  Add Milestone
                </Button>
              </div>
            </div>

            {/* Google Drive Workspace URL */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-dash-textPrimary uppercase tracking-wider flex items-center gap-1.5">
                  <Cloud className="w-3.5 h-3.5 text-brand-500" />
                  <span>Google Drive Project Workspace URL</span>
                </label>
                <a
                  href={customDriveUrl || DEFAULT_MASTER_DRIVE}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-bold text-brand-600 hover:text-brand-800 flex items-center gap-1"
                >
                  <span>Open Drive Folder</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="relative">
                <input
                  type="url"
                  required
                  value={customDriveUrl}
                  onChange={(e) => setCustomDriveUrl(e.target.value)}
                  placeholder="https://drive.google.com/drive/folders/..."
                  className="w-full bg-[#F5F6FA] text-xs font-mono text-dash-textPrimary rounded-smDash px-4 py-2.5 border border-dash-border/80 focus:outline-none focus:border-brand-500"
                />
              </div>
              <p className="text-[11px] text-dash-textSecondary mt-1">
                Default: Epic Craft Master Google Drive Workspace folder.
              </p>
            </div>

            {/* Assignee Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-dash-textPrimary uppercase tracking-wider">
                  Assign Team Members * ({selectedEmployees.length} selected)
                </label>
                <Link
                  href="/ceo/employees"
                  className="text-xs font-bold text-brand-500 hover:underline flex items-center gap-1"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Add Employee</span>
                </Link>
              </div>

              {employees.length === 0 ? (
                <div className="p-6 bg-gray-50 border border-dashed border-dash-border/80 rounded-smDash text-center space-y-2">
                  <Users className="w-8 h-8 text-gray-400 mx-auto" />
                  <p className="text-xs font-bold text-dash-textPrimary">
                    No Employees in Directory Yet
                  </p>
                  <p className="text-xs text-dash-textSecondary max-w-sm mx-auto">
                    Please add your team members before creating a project assignment.
                  </p>
                  <div className="pt-1">
                    <Link href="/ceo/employees">
                      <Button size="sm" icon={<UserPlus className="w-3.5 h-3.5" />}>
                        Add Employee Now
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto p-1">
                  {employees.map((emp) => {
                    const isSelected = selectedEmployees.includes(emp.id);
                    const isLead = leadId === emp.id;
                    return (
                      <div
                        key={emp.id}
                        onClick={() => toggleEmployee(emp.id)}
                        className={`p-3 rounded-smDash border cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? "bg-blue-50/60 border-brand-500 shadow-xs"
                            : "bg-[#F5F6FA] border-transparent hover:border-dash-border/80"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Avatar name={emp.name} size="sm" />
                          <div className="truncate">
                            <div className="text-xs font-bold text-dash-textPrimary truncate">
                              {emp.name}
                            </div>
                            <div className="text-[11px] text-dash-textSecondary truncate">
                              {emp.email}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {isSelected && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setLeadId(emp.id);
                              }}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                                isLead
                                  ? "bg-brand-500 text-white"
                                  : "bg-white text-dash-textSecondary hover:bg-gray-100 border border-dash-border/60"
                              }`}
                            >
                              {isLead ? "Lead" : "Make Lead"}
                            </button>
                          )}
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                              isSelected
                                ? "bg-brand-500 border-brand-500 text-white"
                                : "border-gray-300 bg-white"
                            }`}
                          >
                            {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Google Drive Sharing Helper */}
            {selectedEmployees.length > 0 && (
              <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-smDash space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cloud className="w-4 h-4 text-brand-500" />
                    <span className="text-xs font-bold text-brand-700">
                      Share Google Drive Folder with Selected Team
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={copySelectedEmails}
                    className="text-xs font-bold text-brand-600 hover:text-brand-800 flex items-center gap-1.5 bg-white px-2.5 py-1 rounded border border-blue-200 shadow-xs transition-colors"
                  >
                    {copiedEmails ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-status-completed" />
                        <span className="text-status-completed">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Emails for Drive</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xs text-dash-textSecondary leading-relaxed">
                  Give your team Editor access on Google Drive. Paste these emails into your folder's <strong>Share</strong> dialog:
                </p>
                <div className="mt-2 p-2.5 bg-white rounded border border-blue-100 font-mono text-xs text-gray-700 font-medium break-all select-all">
                  {employees
                    .filter((e) => selectedEmployees.includes(e.id))
                    .map((e) => e.email)
                    .join(", ")}
                </div>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading || employees.length === 0}
              className="w-full py-3 font-bold text-sm shadow-md"
              icon={<FolderPlus className="w-4 h-4" />}
            >
              {loading ? "Assigning Project & Milestones..." : "Assign Project & Notify Team"}
            </Button>
          </form>
        </Card>
      </div>
    </AppLayout>
  );
}
