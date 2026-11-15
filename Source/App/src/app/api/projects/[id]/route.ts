import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { UpdateProjectSchema } from "@/lib/validations";

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
        createdBy: { select: { id: true, name: true, email: true } },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                designation: true,
                department: true,
              },
            },
          },
        },
        tasks: {
          include: {
            assignedTo: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "asc" },
        },
        updates: {
          include: {
            user: { select: { id: true, name: true, email: true } },
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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "CEO") {
      return NextResponse.json(
        { error: "Forbidden: Only CEO can edit projects" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const result = UpdateProjectSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const existing = await prisma.project.findUnique({
      where: { id },
      include: { members: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const {
      title,
      summary,
      category,
      priority,
      status,
      startDate,
      deadline,
      driveFolderUrl,
      assigneeIds,
      leadId,
    } = result.data;

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (summary !== undefined) updateData.summary = summary;
    if (category !== undefined) updateData.category = category;
    if (priority !== undefined) updateData.priority = priority;
    if (status !== undefined) {
      updateData.status = status;
      if (status === "COMPLETED" && !existing.completedAt) {
        updateData.completedAt = new Date();
      } else if (status !== "COMPLETED") {
        updateData.completedAt = null;
      }
    }
    if (startDate) updateData.startDate = new Date(startDate);
    if (deadline) updateData.deadline = new Date(deadline);
    if (driveFolderUrl !== undefined) updateData.driveFolderUrl = driveFolderUrl;

    // Handle member updates and project update inside transaction
    const uniqueAssigneeIds = assigneeIds && Array.isArray(assigneeIds)
      ? Array.from(new Set(assigneeIds))
      : null;

    const operations: any[] = [];
    if (uniqueAssigneeIds) {
      operations.push(
        prisma.projectMember.deleteMany({
          where: { projectId: id },
        })
      );
      operations.push(
        prisma.projectMember.createMany({
          data: uniqueAssigneeIds.map((userId) => ({
            projectId: id,
            userId,
            memberRole: leadId && leadId === userId ? "LEAD" : "CONTRIBUTOR",
          })),
        })
      );
    }

    operations.push(
      prisma.project.update({
        where: { id },
        data: updateData,
        include: {
          members: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
          tasks: true,
        },
      })
    );

    const txResults = await prisma.$transaction(operations);
    const updatedProject = txResults[txResults.length - 1];

    return NextResponse.json({ success: true, project: updatedProject });
  } catch (error: any) {
    console.error("Failed to update project:", error);
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "CEO") {
      return NextResponse.json(
        { error: "Forbidden: Only CEO can remove projects" },
        { status: 403 }
      );
    }

    const { id } = await params;

    const existing = await prisma.project.findUnique({
      where: { id },
      include: { members: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Delete related notifications referencing this project
    await prisma.notification.deleteMany({
      where: {
        message: { contains: existing.code },
      },
    });

    // Delete project (cascade deletes members, tasks, updates, approvals)
    await prisma.project.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: `Project ${existing.code} successfully removed`,
    });
  } catch (error: any) {
    console.error("Failed to delete project:", error);
    return NextResponse.json({ error: "Failed to delete project" }, { status: 500 });
  }
}
