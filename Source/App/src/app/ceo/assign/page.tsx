"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FolderPlus, Users, Calendar, AlertCircle, CheckCircle, Cloud, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { UserSession } from "@/types";

export default function CeoAssignProjectPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserSession | null>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "URGENT">("MEDIUM");
  const [deadline, setDeadline] = useState("");
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [leadId, setLeadId] = useState("");

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
    setSelectedEmployees((prev) => {
      const exists = prev.includes(empId);
      const updated = exists ? prev.filter((id) => id !== empId) : [...prev, empId];
      if (exists && leadId === empId) {
        setLeadId(updated[0] || "");
      }
      if (!exists && updated.length === 1) {
        setLeadId(empId);
      }
      return updated;
    });
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
          priority,
          deadline,
          assigneeIds: selectedEmployees,
          leadId: leadId || selectedEmployees[0],
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
                Automatically creates Google Drive folder and notifies assignees
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
                Project created successfully! Drive folder provisioned and
                notifications sent. Redirecting...
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
                placeholder="e.g. Website Redesign & SEO Optimization"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-[#F5F6FA] text-sm text-dash-textPrimary rounded-smDash px-4 py-2.5 border border-dash-border/80 focus:outline-none focus:border-brand-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-dash-textPrimary mb-1.5 uppercase tracking-wider">
                Project Summary / Scope *
              </label>
              <textarea
                required
                rows={3}
                placeholder="Describe deliverables, required milestones, and success criteria..."
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="w-full bg-[#F5F6FA] text-sm text-dash-textPrimary rounded-smDash px-4 py-2.5 border border-dash-border/80 focus:outline-none focus:border-brand-500 font-medium"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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

              <div>
                <label className="block text-xs font-bold text-dash-textPrimary mb-1.5 uppercase tracking-wider">
                  Deadline *
                </label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full bg-[#F5F6FA] text-sm text-dash-textPrimary rounded-smDash px-4 py-2.5 border border-dash-border/80 focus:outline-none focus:border-brand-500 font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Assignees Selector */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-dash-textPrimary uppercase tracking-wider">
                  Assign Team Members * ({selectedEmployees.length} selected)
                </label>
                <span className="text-[11px] text-gray-400">
                  Click to select assignees
                </span>
              </div>

              {employees.length === 0 ? (
                <div className="p-6 border border-dashed border-dash-border rounded-smDash bg-[#FAFAFA] text-center">
                  <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-dash-textPrimary">No team members registered yet</p>
                  <p className="text-[11px] text-gray-400 mt-0.5 mb-3">
                    Add your team members in the Team Directory before creating projects to assign tasks to them.
                  </p>
                  <Link href="/ceo/employees">
                    <Button size="sm" variant="outline" type="button">
                      Go to Team Directory
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-56 overflow-y-auto p-1 border border-dash-border/60 rounded-smDash bg-[#FAFAFA]">
                  {employees.map((emp) => {
                    const isSelected = selectedEmployees.includes(emp.id);
                    const isLead = leadId === emp.id;
                    return (
                      <div
                        key={emp.id}
                        onClick={() => toggleEmployee(emp.id)}
                        className={`p-3 rounded-md cursor-pointer border transition-all flex items-center justify-between ${
                          isSelected
                            ? "bg-blue-50/90 border-brand-500 shadow-sm"
                            : "bg-white border-dash-border/60 hover:border-gray-300"
                        }`}
                      >
                        <div>
                          <div className="font-bold text-xs text-dash-textPrimary">
                            {emp.name}
                          </div>
                          <div className="text-[10px] text-gray-400 font-medium">
                            {emp.email}
                          </div>
                        </div>

                        {isSelected && (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setLeadId(emp.id);
                              }}
                              className={`px-1.5 py-0.5 text-[9px] font-bold rounded ${
                                isLead
                                  ? "bg-brand-500 text-white"
                                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                              }`}
                            >
                              {isLead ? "LEAD" : "Set Lead"}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Drive Provisioning Info Notice */}
            <div className="p-4 bg-brand-50/60 rounded-smDash border border-brand-100 flex items-start gap-3">
              <Cloud className="w-5 h-5 text-brand-500 shrink-0 mt-0.5" />
              <div className="text-xs text-dash-textSecondary">
                <strong className="text-brand-600 block mb-0.5">
                  Automated Google Drive Provisioning
                </strong>
                Upon clicking "Assign Project", a Google Drive folder `Epic Craft /
                Projects / {title || "<ProjectName>"}` will be created and shared
                automatically with editor permissions for all selected employees.
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full py-3 font-bold text-sm shadow-md"
              icon={<FolderPlus className="w-4 h-4" />}
            >
              {loading ? "Creating & Provisioning Drive..." : "Assign Project & Notify Team"}
            </Button>
          </form>
        </Card>
      </div>
    </AppLayout>
  );
}
