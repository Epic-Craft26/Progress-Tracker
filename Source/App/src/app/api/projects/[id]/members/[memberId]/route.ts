import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ChangeMemberRoleSchema, RemoveProjectMemberSchema } from "@/lib/validations";
import { revokeDriveFolderAccess } from "@/lib/drive";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "CEO") {
      return NextResponse.json(
        { error: "Forbidden: Only CEO can change member roles" },
        { status: 403 }
      );
    }

    const { id: projectId, memberId } = await params;
    const body = await request.json();
    const result = ChangeMemberRoleSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { memberRole } = result.data;

    const member = await prisma.projectMember.findFirst({
      where: { id: memberId, projectId },
      include: { user: true, project: true },
    });

    if (!member) {
      return NextResponse.json(
        { error: "Project member record not found" },
        { status: 404 }
      );
    }

    const operations: any[] = [];

    // If promoting to LEAD, demote current LEAD
    if (memberRole === "LEAD") {
      operations.push(
        prisma.projectMember.updateMany({
          where: { projectId, memberRole: "LEAD" },
          data: { memberRole: "CONTRIBUTOR" },
        })
      );
    }

    operations.push(
      prisma.projectMember.update({
        where: { id: memberId },
        data: { memberRole },
      })
    );

    // Audit log
    operations.push(
      prisma.projectUpdate.create({
        data: {
          projectId,
          userId: session.id,
          progress: member.project.progress,
          note: `CEO updated role for ${member.user.name} to ${
            memberRole === "LEAD" ? "Project Lead" : "Contributor"
          }.`,
        },
      })
    );

    await prisma.$transaction(operations);

    return NextResponse.json({
      success: true,
      message: `${member.user.name} role updated to ${memberRole}`,
    });
  } catch (err: any) {
    console.error("Failed to update member role:", err);
    return NextResponse.json(
      { error: err.message || "Failed to update member role" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "CEO") {
      return NextResponse.json(
        { error: "Forbidden: Only CEO can remove members from live projects" },
        { status: 403 }
      );
    }

    const { id: projectId, memberId } = await params;

    // Parse optional body or query param for task reassignment
    let reassignTasksToUserId: string | null = null;
    try {
      const url = new URL(request.url);
      const queryReassign = url.searchParams.get("reassignTo");
      if (queryReassign) {
        reassignTasksToUserId = queryReassign;
      } else {
        const body = await request.json().catch(() => null);
        if (body) {
          const parsed = RemoveProjectMemberSchema.safeParse(body);
          if (parsed.success) {
            reassignTasksToUserId = parsed.data.reassignTasksToUserId || null;
          }
        }
      }
    } catch {
      // Ignore body parse errors if empty
    }

    const member = await prisma.projectMember.findFirst({
      where: { id: memberId, projectId },
      include: { user: true, project: true },
    });

    if (!member) {
      return NextResponse.json(
        { error: "Member not found in this project" },
        { status: 404 }
      );
    }

    const removedUserId = member.userId;
    const project = member.project;

    // Check count of tasks assigned to this employee in this project
    const memberTasks = await prisma.task.findMany({
      where: { projectId, assignedToId: removedUserId },
    });

    const operations: any[] = [];

    // Reassign tasks if requested, else set assignedToId = null
    if (reassignTasksToUserId && reassignTasksToUserId !== removedUserId) {
      // Verify reassignee is valid active user
      const targetUser = await prisma.user.findUnique({
        where: { id: reassignTasksToUserId },
      });
      if (targetUser) {
        operations.push(
          prisma.task.updateMany({
            where: { projectId, assignedToId: removedUserId },
            data: { assignedToId: reassignTasksToUserId },
          })
        );
      } else {
        operations.push(
          prisma.task.updateMany({
            where: { projectId, assignedToId: removedUserId },
            data: { assignedToId: null },
          })
        );
      }
    } else {
      operations.push(
        prisma.task.updateMany({
          where: { projectId, assignedToId: removedUserId },
          data: { assignedToId: null },
        })
      );
    }

    // Delete the membership record
    operations.push(
      prisma.projectMember.delete({
        where: { id: memberId },
      })
    );

    // Create notification for removed employee
    operations.push(
      prisma.notification.create({
        data: {
          userId: removedUserId,
          title: `Removed from ${project.title}`,
          message: `You were removed from project "${project.title}" (${project.code}) by CEO ${session.name}.`,
          type: "INFO",
          link: "/employee/projects",
        },
      })
    );

    // Audit log
    const reassignText =
      reassignTasksToUserId && memberTasks.length > 0
        ? ` (${memberTasks.length} tasks reassigned)`
        : memberTasks.length > 0
        ? ` (${memberTasks.length} tasks moved to unassigned backlog)`
        : "";

    operations.push(
      prisma.projectUpdate.create({
        data: {
          projectId,
          userId: session.id,
          progress: project.progress,
          note: `CEO removed ${member.user.name} (${member.user.email}) from project team${reassignText}.`,
        },
      })
    );

    await prisma.$transaction(operations);

    // Revoke Drive folder permission asynchronously if project has folder
    if (project.driveFolderId && member.user.email) {
      revokeDriveFolderAccess(project.driveFolderId, member.user.email).catch((e) =>
        console.warn("Google Drive permission revocation failed:", e)
      );
    }

    return NextResponse.json({
      success: true,
      message: `${member.user.name} removed from ${project.title}`,
      reassignedTasksCount: memberTasks.length,
    });
  } catch (err: any) {
    console.error("Failed to remove project member:", err);
    return NextResponse.json(
      { error: err.message || "Failed to remove team member" },
      { status: 500 }
    );
  }
}
