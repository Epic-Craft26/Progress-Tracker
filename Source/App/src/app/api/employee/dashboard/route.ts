import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const memberships = await prisma.projectMember.findMany({
      where: { userId: session.id },
      include: {
        project: {
          include: {
            createdBy: { select: { name: true, email: true } },
            members: {
              include: {
                user: { select: { id: true, name: true, email: true } },
              },
            },
            tasks: {
              orderBy: { createdAt: "asc" },
            },
            updates: {
              orderBy: { createdAt: "desc" },
              take: 3,
              include: { user: true },
            },
            approvals: {
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
        },
      },
      orderBy: { project: { updatedAt: "desc" } },
    });

    const projects = memberships.map((m) => ({
      ...m.project,
      memberRole: m.memberRole,
    }));

    const now = new Date();
    const activeProjects = projects.filter(
      (p) =>
        p.status === "IN_PROGRESS" ||
        p.status === "NOT_STARTED" ||
        p.status === "REVISION_REQUESTED"
    );
    const inReviewProjects = projects.filter((p) => p.status === "PENDING_REVIEW");
    const completedProjects = projects.filter((p) => p.status === "COMPLETED");
    const overdueProjects = projects.filter(
      (p) => p.status !== "COMPLETED" && new Date(p.deadline) < now
    );

    // Personal on-time rate
    const onTimeCompleted = completedProjects.filter(
      (p) => !p.completedAt || new Date(p.completedAt) <= new Date(p.deadline)
    ).length;
    const onTimeRate =
      completedProjects.length > 0
        ? Math.round((onTimeCompleted / completedProjects.length) * 100)
        : 100;

    return NextResponse.json({
      stats: {
        active: activeProjects.length,
        inReview: inReviewProjects.length,
        completed: completedProjects.length,
        overdue: overdueProjects.length,
        onTimeRate,
      },
      projects,
    });
  } catch (error: any) {
    console.error("Failed to load employee dashboard:", error);
    return NextResponse.json(
      { error: "Failed to load employee dashboard" },
      { status: 500 }
    );
  }
}
