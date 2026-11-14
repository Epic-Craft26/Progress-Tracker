import { prisma } from "@/lib/prisma";

export async function getCeoDashboardStats() {
  const [totalProjects, inProgress, pendingReview, completed, allProjects, employees] =
    await Promise.all([
      prisma.project.count(),
      prisma.project.count({ where: { status: "IN_PROGRESS" } }),
      prisma.project.count({ where: { status: "PENDING_REVIEW" } }),
      prisma.project.count({ where: { status: "COMPLETED" } }),
      prisma.project.findMany({
        include: {
          members: { include: { user: true } },
          tasks: true,
          updates: {
            orderBy: { createdAt: "desc" },
            take: 1,
            include: { user: true },
          },
        },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.user.findMany({
        where: { role: "EMPLOYEE" },
        include: {
          assignedProjects: {
            include: { project: true },
          },
        },
      }),
    ]);

  const now = new Date();
  const overdue = allProjects.filter(
    (p) => p.status !== "COMPLETED" && new Date(p.deadline) < now
  ).length;

  const onTimeProjects = allProjects.filter(
    (p) => p.status === "COMPLETED" && (!p.completedAt || new Date(p.completedAt) <= new Date(p.deadline))
  ).length;

  const onTimeRate =
    completed > 0 ? Math.round((onTimeProjects / completed) * 100) : 0;

  // Recent activity stream
  const recentUpdates = await prisma.projectUpdate.findMany({
    orderBy: { createdAt: "desc" },
    take: 6,
    include: {
      user: true,
      project: true,
    },
  });

  return {
    kpis: {
      totalProjects,
      inProgress,
      pendingReview,
      overdue,
      completed,
      onTimeRate,
    },
    recentProjects: allProjects.slice(0, 5),
    recentUpdates,
    employeesCount: employees.length,
  };
}

export async function getNextProjectCode(): Promise<string> {
  const count = await prisma.project.count();
  const nextNum = (count + 1).toString().padStart(3, "0");
  return `EC-PRJ-${nextNum}`;
}
