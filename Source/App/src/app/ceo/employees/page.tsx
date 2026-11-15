"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  Mail,
  Shield,
  CheckCircle,
  Briefcase,
  AlertCircle,
  Copy,
  KeyRound,
  Check,
  Trash2,
  Power,
  RotateCcw,
  Building,
  UserCheck,
  AlertTriangle,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Avatar } from "@/components/ui/Avatar";
import { UserSession } from "@/types";

export default function CeoEmployeesPage() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [designation, setDesignation] = useState("Team Contributor");
  const [department, setDepartment] = useState("Art & Design");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [createdInfo, setCreatedInfo] = useState<{
    email: string;
    temporaryKey: string;
    name: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Reset Password Modal State
  const [resetModalData, setResetModalData] = useState<{
    employeeName: string;
    employeeEmail: string;
    temporaryKey: string;
  } | null>(null);
  const [resetCopied, setResetCopied] = useState(false);

  // Delete Employee Confirmation
  const [employeeToDelete, setEmployeeToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadEmployees = () => {
    setLoading(true);
    fetch("/api/employees")
      .then((r) => r.json())
      .then((d) => setEmployees(d.employees || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.user) setUser(d.user);
      });
    loadEmployees();
  }, []);

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setCreatedInfo(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, designation, department }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create employee");

      setCreatedInfo({
        email: data.employee.email,
        temporaryKey: data.temporaryKey,
        name: data.employee.name,
      });
      setName("");
      setEmail("");
      setDesignation("Team Contributor");
      setDepartment("Art & Design");
      loadEmployees();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const copyCredentials = () => {
    if (!createdInfo) return;
    const text = `Epic Craft Account Details\nName: ${createdInfo.name}\nEmail: ${createdInfo.email}\nTemporary Password: ${createdInfo.temporaryKey}\nLogin Portal: ${window.location.origin}/login`;
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Reset Password Handler
  const handleResetPassword = async (emp: any) => {
    if (
      !confirm(
        `Generate a new temporary password for ${emp.name} (${emp.email})?`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/employees/${emp.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "RESET_PASSWORD" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reset password");

      setResetModalData({
        employeeName: data.employeeName,
        employeeEmail: data.employeeEmail,
        temporaryKey: data.temporaryKey,
      });
    } catch (err: any) {
      alert(err.message);
    }
  };

  const copyResetCredentials = () => {
    if (!resetModalData) return;
    const text = `Epic Craft Password Reset\nName: ${resetModalData.employeeName}\nEmail: ${resetModalData.employeeEmail}\nTemporary Password: ${resetModalData.temporaryKey}\nLogin Portal: ${window.location.origin}/login`;
    navigator.clipboard.writeText(text).catch(() => {});
    setResetCopied(true);
    setTimeout(() => setResetCopied(false), 2000);
  };

  // Toggle Active/Inactive
  const handleToggleActive = async (emp: any) => {
    try {
      const res = await fetch(`/api/employees/${emp.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "TOGGLE_ACTIVE" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update employee");

      loadEmployees();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Delete Employee Handler
  const handleDeleteEmployee = async () => {
    if (!employeeToDelete) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/employees/${employeeToDelete.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to remove employee");

      setEmployeeToDelete(null);
      loadEmployees();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-dash-bg flex items-center justify-center">
        <div className="text-xs font-bold text-gray-400">Loading Directory...</div>
      </div>
    );
  }

  return (
    <AppLayout user={user} title="Team & Employee Management">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-dash-textPrimary tracking-tight">
            Team & Employee Management
          </h1>
          <p className="text-xs text-dash-textSecondary mt-0.5">
            Manage employee access, reset passwords, and provision Google Drive accounts
          </p>
        </div>

        <Button
          onClick={() => {
            setCreatedInfo(null);
            setError("");
            setShowAddModal(true);
          }}
          icon={<UserPlus className="w-4 h-4" />}
        >
          Add New Employee
        </Button>
      </div>

      {/* Employees Grid (DashStack User Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 text-center text-xs text-gray-400">
            Loading team members...
          </div>
        ) : employees.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white rounded-dash border border-dash-border/60">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-dash-textPrimary">No team members added yet</h3>
            <p className="text-xs text-gray-400 mt-1 mb-4 max-w-sm mx-auto">
              Your company directory is currently empty. Add your employees to assign them to projects.
            </p>
            <Button
              onClick={() => {
                setCreatedInfo(null);
                setError("");
                setShowAddModal(true);
              }}
              icon={<UserPlus className="w-4 h-4" />}
            >
              Add First Employee
            </Button>
          </div>
        ) : (
          employees.map((emp) => (
            <Card key={emp.id} className="relative overflow-hidden flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={emp.name} size="lg" />
                    <div>
                      <h3 className="font-bold text-sm text-dash-textPrimary">
                        {emp.name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[11px] font-semibold text-brand-600 bg-blue-50 px-2 py-0.5 rounded">
                          {emp.designation || "Contributor"}
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium">
                          {emp.department || "General"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                      emp.isActive
                        ? "bg-emerald-50 text-status-completed border-emerald-200"
                        : "bg-gray-100 text-gray-500 border-gray-300"
                    }`}
                  >
                    {emp.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="space-y-2 text-xs text-dash-textSecondary border-t border-b border-dash-border/40 py-3 my-3">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="truncate font-mono">{emp.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span>
                      <strong>{emp.stats.activeCount}</strong> Active Projects (
                      {emp.stats.completedCount} Completed)
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="pt-2 border-t border-dash-border/30 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => handleResetPassword(emp)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-600 hover:text-brand-800 transition-colors"
                  title="Reset temporary password"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Pass</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(emp)}
                    className={`p-1.5 rounded text-xs font-semibold transition-colors ${
                      emp.isActive
                        ? "text-gray-400 hover:text-amber-600 hover:bg-amber-50"
                        : "text-status-completed hover:bg-emerald-50"
                    }`}
                    title={emp.isActive ? "Deactivate employee" : "Activate employee"}
                  >
                    <Power className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setEmployeeToDelete(emp)}
                    className="p-1.5 rounded text-gray-400 hover:text-status-delayed hover:bg-red-50 transition-colors"
                    title="Remove employee from company"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Add Employee Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={createdInfo ? "Employee Account Created" : "Add Team Member"}
        maxWidth="md"
      >
        {createdInfo ? (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-dash">
              <div className="flex items-center gap-2 text-status-completed font-bold text-sm mb-3">
                <CheckCircle className="w-5 h-5" />
                <span>Account Activated Successfully</span>
              </div>

              <div className="space-y-2 text-xs text-dash-textPrimary">
                <div className="flex justify-between py-1 border-b border-emerald-100">
                  <span className="text-gray-500">Employee Name:</span>
                  <span className="font-bold">{createdInfo.name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-emerald-100">
                  <span className="text-gray-500">Google Drive Email:</span>
                  <span className="font-mono font-bold text-brand-600">
                    {createdInfo.email}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-500">Temporary Password:</span>
                  <span className="font-mono font-bold text-status-pending">
                    {createdInfo.temporaryKey}
                  </span>
                </div>
              </div>

              <p className="text-[10px] text-gray-500 mt-3 italic">
                The employee can log in using their email and temporary password, and will be prompted to set their permanent password.
              </p>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={copyCredentials}
                icon={copied ? <Check className="w-3.5 h-3.5 text-status-completed" /> : <Copy className="w-3.5 h-3.5" />}
              >
                {copied ? "Copied to Clipboard!" : "Copy Details"}
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setCreatedInfo(null);
                  setShowAddModal(false);
                }}
              >
                Done
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCreateEmployee} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-smDash flex items-center gap-2 text-xs text-status-delayed font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-dash-textPrimary mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Alex Rivera"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#F5F6FA] text-xs text-dash-textPrimary rounded-smDash px-3.5 py-2.5 border border-dash-border/80 focus:outline-none focus:border-brand-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-dash-textPrimary mb-1">
                Google Drive Email *
              </label>
              <input
                type="email"
                required
                placeholder="alex@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#F5F6FA] text-xs font-mono text-dash-textPrimary rounded-smDash px-3.5 py-2.5 border border-dash-border/80 focus:outline-none focus:border-brand-500 font-medium"
              />
              <p className="text-[11px] text-dash-textSecondary mt-1">
                Must be the active Google Account email they use to access Google Drive.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-dash-textPrimary mb-1">
                  Designation / Role
                </label>
                <input
                  type="text"
                  placeholder="e.g. 3D Animator, UI Designer"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  className="w-full bg-[#F5F6FA] text-xs text-dash-textPrimary rounded-smDash px-3.5 py-2.5 border border-dash-border/80 focus:outline-none focus:border-brand-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-dash-textPrimary mb-1">
                  Department
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full bg-[#F5F6FA] text-xs text-dash-textPrimary rounded-smDash px-3.5 py-2.5 border border-dash-border/80 focus:outline-none focus:border-brand-500 font-medium"
                >
                  <option value="Art & Design">Art & Design</option>
                  <option value="Game Development">Game Development</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Research & Docs">Research & Docs</option>
                  <option value="Quality Assurance">Quality Assurance</option>
                  <option value="Marketing">Marketing</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-dash-border/60">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" loading={submitting}>
                Create Employee
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Password Reset Modal */}
      <Modal
        isOpen={!!resetModalData}
        onClose={() => setResetModalData(null)}
        title="Password Reset Generated"
        maxWidth="sm"
      >
        {resetModalData && (
          <div className="space-y-4">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-dash text-xs space-y-2">
              <div className="flex items-center gap-2 text-status-pending font-bold">
                <KeyRound className="w-4 h-4" />
                <span>New Temporary Credentials</span>
              </div>
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">Employee:</span>
                  <span className="font-bold">{resetModalData.employeeName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Email:</span>
                  <span className="font-mono">{resetModalData.employeeEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">New Temp Key:</span>
                  <span className="font-mono font-bold text-brand-600 bg-white px-2 py-0.5 rounded border border-amber-200">
                    {resetModalData.temporaryKey}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={copyResetCredentials}
                icon={resetCopied ? <Check className="w-3.5 h-3.5 text-status-completed" /> : <Copy className="w-3.5 h-3.5" />}
              >
                {resetCopied ? "Copied!" : "Copy Details"}
              </Button>
              <Button size="sm" onClick={() => setResetModalData(null)}>
                Done
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Remove Employee Confirmation Modal */}
      <Modal
        isOpen={!!employeeToDelete}
        onClose={() => setEmployeeToDelete(null)}
        title="Remove Employee"
        maxWidth="sm"
      >
        {employeeToDelete && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-100 text-status-delayed flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <h4 className="font-bold text-red-900 mb-0.5">Remove Team Member</h4>
                <p className="text-red-700 leading-relaxed">
                  Are you sure you want to remove <strong>{employeeToDelete.name}</strong> ({employeeToDelete.email}) from Epic Craft?
                </p>
                <p className="text-red-600 mt-1 text-[11px]">
                  Their account login and assigned tasks will be detached.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEmployeeToDelete(null)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleDeleteEmployee}
                loading={isDeleting}
                className="bg-status-delayed hover:bg-red-700 text-white"
              >
                Yes, Remove Employee
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </AppLayout>
  );
}
