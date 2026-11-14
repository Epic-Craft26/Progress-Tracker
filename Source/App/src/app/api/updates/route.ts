import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { PostUpdateSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const result = PostUpdateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { projectId, progress, note, status, attachments } = result.data;

    // Verify employee is assigned or user is CEO
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (session.role === "EMPLOYEE") {
      const isMember = project.members.some((m) => m.userId === session.id);
      if (!isMember) {
        return NextResponse.json(
          { error: "Forbidden: You are not assigned to this project" },
          { status: 403 }
        );
      }
    }

    // Determine target project status
    let targetStatus = project.status;
    if (status) {
      targetStatus = status;
    } else if (progress >= 100) {
      targetStatus = "PENDING_REVIEW";
    } else if (project.status === "NOT_STARTED" && progress > 0) {
      targetStatus = "IN_PROGRESS";
    }

    // Save update and update project
    const [updateRecord, updatedProject] = await prisma.$transaction([
      prisma.projectUpdate.create({
        data: {
          projectId,
          userId: session.id,
          progress,
          note,
          attachments: attachments || null,
        },
      }),
      prisma.project.update({
        where: { id: projectId },
        data: {
          progress,
          status: targetStatus,
          updatedAt: new Date(),
        },
      }),
    ]);

    // If submitted for review or high milestone, notify CEO
    const ceo = await prisma.user.findFirst({ where: { role: "CEO" } });
    if (ceo && ceo.id !== session.id) {
      const isCompleteSubmission = targetStatus === "PENDING_REVIEW";
      await prisma.notification.create({
        data: {
          userId: ceo.id,
          title: isCompleteSubmission
            ? `Review Needed: ${project.code}`
            : `Update on ${project.code}`,
          message: isCompleteSubmission
            ? `${session.name} marked ${project.code} as 100% complete. Needs approval.`
            : `${session.name} updated ${project.code} progress to ${progress}%.`,
          type: isCompleteSubmission ? "APPROVAL" : "UPDATE",
          link: isCompleteSubmission ? "/ceo/approvals" : `/ceo/projects`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      update: updateRecord,
      project: updatedProject,
    });
  } catch (error: any) {
    console.error("Failed to post update:", error);
    return NextResponse.json({ error: "Failed to post update" }, { status: 500 });
  }
}
