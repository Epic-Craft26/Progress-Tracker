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

  // Form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [initialPassword, setInitialPassword] = useState("Pass@123");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
    setSuccess("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, initialPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create employee");

      setSuccess(`Employee ${data.employee.employeeId} registered successfully!`);
      setName("");
      setEmail("");
      setTimeout(() => {
        setShowAddModal(false);
        setSuccess("");
        loadEmployees();
      }, 1200);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <AppLayout user={user} title="Employee Directory & ID Management">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-dash-textPrimary tracking-tight">
            Team & Access Management
          </h1>
          <p className="text-xs text-dash-textSecondary mt-0.5">
            Issue unique employee IDs and manage Google Drive workspace access
          </p>
        </div>

        <Button
          onClick={() => setShowAddModal(true)}
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
        ) : (
          employees.map((emp) => (
            <Card key={emp.id} className="relative overflow-hidden">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <Avatar name={emp.name} size="lg" />
                  <div>
                    <h3 className="font-bold text-sm text-dash-textPrimary">
                      {emp.name}
                    </h3>
                    <div className="inline-flex items-center gap-1 font-mono text-xs font-bold text-brand-600 bg-blue-50 px-2 py-0.5 rounded mt-0.5">
                      {emp.employeeId}
                    </div>
                  </div>
                </div>
                <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-50 text-status-completed border border-emerald-200">
                  Active
                </span>
              </div>

              <div className="space-y-2 text-xs text-dash-textSecondary border-t border-b border-dash-border/40 py-3 my-3">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span className="truncate">{emp.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Briefcase className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span>
                    <strong>{emp.stats.activeCount}</strong> Active Projects (
                    {emp.stats.completedCount} Completed)
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-gray-400 font-medium">
                <span>Google Drive Synced</span>
                <span className="text-brand-500 font-semibold">Editor Access</span>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Add Employee Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Employee"
        description="Creates unique EC ID and binds Google Drive email for automated project sharing."
      >
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-smDash flex items-start gap-2 text-xs text-status-delayed font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-smDash text-xs text-status-completed font-semibold">
            {success}
          </div>
        )}

        <form onSubmit={handleCreateEmployee} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-dash-textPrimary mb-1 uppercase tracking-wider">
              Full Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Rahul Verma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#F5F6FA] text-sm rounded-smDash p-2.5 border border-dash-border/80 focus:outline-none focus:border-brand-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-dash-textPrimary mb-1 uppercase tracking-wider">
              Google Drive Email *
            </label>
            <input
              type="email"
              required
              placeholder="e.g. rahul.epiccraft@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#F5F6FA] text-sm rounded-smDash p-2.5 border border-dash-border/80 focus:outline-none focus:border-brand-500 font-medium"
            />
            <p className="text-[10px] text-gray-400 mt-1">
              Google Account required for automated Drive folder sharing.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-dash-textPrimary mb-1 uppercase tracking-wider">
              First-Time Temporary Password *
            </label>
            <input
              type="text"
              required
              value={initialPassword}
              onChange={(e) => setInitialPassword(e.target.value)}
              className="w-full bg-[#F5F6FA] text-sm rounded-smDash p-2.5 border border-dash-border/80 focus:outline-none focus:border-brand-500 font-mono"
            />
            <p className="text-[10px] text-gray-400 mt-1">
              The employee will be prompted to change this upon first login.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-dash-border/40">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAddModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Issuing ID..." : "Create Account & Issue ID"}
            </Button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
