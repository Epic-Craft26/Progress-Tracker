"use client";

import React, { useState, useEffect } from "react";
import { Award, CheckCircle2, Calendar, ExternalLink, MessageSquare } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/Card";
import { StatusBadge, PriorityBadge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import { UserSession } from "@/types";

export default function EmployeeHistoryPage() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [completedProjects, setCompletedProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.user) setUser(d.user);
      });

    fetch("/api/employee/dashboard")
      .then((r) => r.json())
      .then((d) => {
        const completed = (d.projects || []).filter(
          (p: any) => p.status === "COMPLETED"
        );
        setCompletedProjects(completed);
      })
      .finally(() => setLoading(false));
  }, []);

  if (!user) return null;

  return (
    <AppLayout user={user} title="History">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-dash-textPrimary tracking-tight">
          History
        </h1>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="py-12 text-center text-xs text-gray-400">
            Loading project history...
          </div>
        ) : completedProjects.length === 0 ? (
          <Card className="py-16 text-center">
            <CheckCircle2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-dash-textPrimary">
              No completed projects yet
            </h3>
            <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
              Once you finish your active assignments and the CEO approves them,
              they will be archived in your performance stats here.
            </p>
          </Card>
        ) : (
          completedProjects.map((p) => {
            const approval = p.approvals?.[0];
            return (
              <Card key={p.id} className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-dash-border/40">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-bold text-brand-600 bg-blue-50 px-2 py-0.5 rounded">
                        {p.code}
                      </span>
                      <StatusBadge status="COMPLETED" />
                      <PriorityBadge priority={p.priority} />
                    </div>
                    <h3 className="text-base font-bold text-dash-textPrimary">
                      {p.title}
                    </h3>
                  </div>

                  {p.driveFolderUrl && (
                    <a
                      href={p.driveFolderUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-gray-700 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Drive Archive</span>
                    </a>
                  )}
                </div>

                <div className="py-3 text-xs text-dash-textSecondary leading-relaxed">
                  {p.summary}
                </div>

                {/* CEO Approval Feedback */}
                {approval && (
                  <div className="mt-2 p-3 bg-emerald-50/70 border border-emerald-200/60 rounded-md">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-status-completed mb-1">
                      <Award className="w-3.5 h-3.5" />
                      <span>CEO Approval Note:</span>
                    </div>
                    <p className="text-xs text-gray-700 italic">
                      "{approval.feedback}"
                    </p>
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>
    </AppLayout>
  );
}
