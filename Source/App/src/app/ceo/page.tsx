import React from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Briefcase,
  Clock,
  AlertTriangle,
  Award,
  PlusCircle,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  FolderKanban,
} from "lucide-react";
import { getSession } from "@/lib/auth";
import { getCeoDashboardStats } from "@/lib/projects";
import { AppLayout } from "@/components/layout/AppLayout";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatusBadge, PriorityBadge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Avatar, AvatarGroup } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";

export default async function CeoDashboardPage() {
  const session = await getSession();
  if (!session || session.role !== "CEO") {
    redirect("/login");
  }

  const { kpis, recentProjects, recentUpdates, employeesCount } =
    await getCeoDashboardStats();

  return (
    <AppLayout user={session} title="CEO Executive Command Center">
      {/* KPI Cards Row (DashStack Style) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Active Projects"
          value={kpis.inProgress}
          subtitle={kpis.inProgress === 0 ? "No active projects" : `${kpis.inProgress} currently ongoing`}
          icon={<Briefcase className="w-6 h-6 text-brand-500" />}
          iconBgColor="bg-blue-50"
        />
        <MetricCard
          title="Pending Approvals"
          value={kpis.pendingReview}
          subtitle={kpis.pendingReview === 0 ? "No pending sign-offs" : `${kpis.pendingReview} awaiting CEO review`}
          icon={<Clock className="w-6 h-6 text-status-pending" />}
          iconBgColor="bg-amber-50"
        />
        <MetricCard
          title="Overdue / Stalled"
          value={kpis.overdue}
          subtitle={kpis.overdue === 0 ? "All on schedule" : `${kpis.overdue} require attention`}
          icon={<AlertTriangle className="w-6 h-6 text-status-delayed" />}
          iconBgColor="bg-red-50"
        />
        <MetricCard
          title="On-Time Delivery"
          value={kpis.completed > 0 ? `${kpis.onTimeRate}%` : "—"}
          subtitle={kpis.completed > 0 ? `${kpis.completed} completed` : "No completed projects"}
          icon={<Award className="w-6 h-6 text-status-completed" />}
          iconBgColor="bg-emerald-50"
        />
      </div>

      {/* Main Grid: Projects Table + Live Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Projects Overview Table */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-dash-border/40">
              <div>
                <h3 className="text-lg font-bold text-dash-textPrimary">
                  Active Projects Progress
                </h3>
                <p className="text-xs text-dash-textSecondary mt-0.5">
                  Live updates & automated Google Drive synchronization
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link href="/ceo/assign">
                  <Button size="sm" icon={<PlusCircle className="w-4 h-4" />}>
                    Assign Project
                  </Button>
                </Link>
                <Link href="/ceo/projects">
                  <Button variant="outline" size="sm">
                    View All
                  </Button>
                </Link>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-dash-border/60 text-gray-400 uppercase tracking-wider font-bold">
                    <th className="pb-3 pl-2">Project</th>
                    <th className="pb-3">Team</th>
                    <th className="pb-3">Progress</th>
                    <th className="pb-3">Priority</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 pr-2 text-right">Drive</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dash-border/30">
                  {recentProjects.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-14 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mb-3 text-brand-500">
                            <FolderKanban className="w-6 h-6" />
                          </div>
                          <h4 className="text-sm font-bold text-dash-textPrimary">
                            No Projects Created Yet
                          </h4>
                          <p className="text-xs text-dash-textSecondary mt-1 mb-4 max-w-sm">
                            Create your first project workspace with automated Google Drive integration.
                          </p>
                          <Link href="/ceo/assign">
                            <Button size="sm" icon={<PlusCircle className="w-4 h-4" />}>
                              + Assign First Project
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    recentProjects.map((p) => (
                      <tr
                        key={p.id}
                        className="hover:bg-gray-50/80 transition-colors group"
                      >
                        <td className="py-3.5 pl-2 max-w-[200px]">
                          <div className="font-bold text-dash-textPrimary truncate group-hover:text-brand-500 transition-colors">
                            {p.title}
                          </div>
                          <div className="text-[11px] text-gray-400 font-medium">
                            {p.code} • Due {formatDate(p.deadline)}
                          </div>
                        </td>
                        <td className="py-3.5">
                          <AvatarGroup
                            users={p.members.map((m) => ({ name: m.user.name }))}
                          />
                        </td>
                        <td className="py-3.5 w-36">
                          <ProgressBar value={p.progress} size="sm" />
                        </td>
                        <td className="py-3.5">
                          <PriorityBadge priority={p.priority as any} />
                        </td>
                        <td className="py-3.5">
                          <StatusBadge status={p.status as any} />
                        </td>
                        <td className="py-3.5 pr-2 text-right">
                          {p.driveFolderUrl ? (
                            <a
                              href={p.driveFolderUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-500 hover:text-brand-700 hover:underline"
                            >
                              <span>Folder</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-gray-400 text-[11px]">N/A</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right Column: Live Activity Feed */}
        <div className="space-y-6">
          <Card>
            <CardHeader
              title="Live Activity Stream"
              subtitle="Real-time employee submissions & milestones"
            />
            <div className="space-y-4">
              {recentUpdates.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-6">
                  No activity updates logged yet.
                </p>
              ) : (
                recentUpdates.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-dash-border/40"
                  >
                    <Avatar name={u.user.name} size="sm" className="mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-dash-textPrimary truncate">
                          {u.user.name}
                        </span>
                        <span className="text-[10px] text-gray-400 shrink-0">
                          {new Date(u.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="text-[11px] font-medium text-brand-600 truncate mt-0.5">
                        {u.project.code}: {u.project.title}
                      </p>
                      <p className="text-xs text-dash-textSecondary mt-1 line-clamp-2">
                        {u.note}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                          Progress: {u.progress}%
                        </span>
                        {u.attachments && (
                          <span className="text-[10px] text-brand-500 font-semibold flex items-center gap-0.5">
                            <ExternalLink className="w-2.5 h-2.5" /> Drive Files
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Quick Team Workload Summary */}
          <Card className="bg-gradient-to-br from-brand-50/50 to-white">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-dash-textSecondary uppercase tracking-wider">
                Workforce Status
              </span>
              <span className="text-xs font-bold text-brand-600">
                {employeesCount} Active Staff
              </span>
            </div>
            <p className="text-xs text-dash-textSecondary leading-relaxed">
              All employee accounts are configured with Google Drive email sync.
              Project assignments auto-share drive folders with write
              permissions.
            </p>
            <Link href="/ceo/employees" className="mt-4 block">
              <Button variant="secondary" size="sm" className="w-full">
                Manage Employee Access
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
