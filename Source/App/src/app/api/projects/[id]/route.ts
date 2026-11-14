import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true, employeeId: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, employeeId: true } },
          },
        },
        tasks: {
          include: {
            assignedTo: { select: { id: true, name: true } },
          },
        },
        updates: {
          include: {
            user: { select: { id: true, name: true, employeeId: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        approvals: {
          include: {
            reviewer: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check authorization for Employee
    if (session.role === "EMPLOYEE") {
      const isMember = project.members.some((m) => m.userId === session.id);
      if (!isMember) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    return NextResponse.json({ project });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to load project" }, { status: 500 });
  }
}
