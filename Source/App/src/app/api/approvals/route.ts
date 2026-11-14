import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ApprovalReviewSchema } from "@/lib/validations";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "CEO") {
      return NextResponse.json({ error: "Forbidden: CEO only" }, { status: 403 });
    }

    const pending = await prisma.project.findMany({
      where: { status: "PENDING_REVIEW" },
      include: {
        members: { include: { user: true } },
        updates: {
          orderBy: { createdAt: "desc" },
          take: 3,
          include: { user: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ projects: pending });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch approvals" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "CEO") {
      return NextResponse.json({ error: "Forbidden: CEO only" }, { status: 403 });
    }

    const body = await request.json();
    const result = ApprovalReviewSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { projectId, decision, feedback } = result.data;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const newStatus = decision === "APPROVED" ? "COMPLETED" : "REVISION_REQUESTED";
    const completedAt = decision === "APPROVED" ? new Date() : null;

    // Record review and update project status
    await prisma.$transaction([
      prisma.approvalReview.create({
        data: {
          projectId,
          reviewedById: session.id,
          decision,
          feedback: feedback || (decision === "APPROVED" ? "Approved by CEO" : "Revisions needed"),
        },
      }),
      prisma.project.update({
        where: { id: projectId },
        data: {
          status: newStatus,
          completedAt,
        },
      }),
      // Notify team members
      ...project.members.map((m) =>
        prisma.notification.create({
          data: {
            userId: m.userId,
            title: decision === "APPROVED" ? "Project Approved!" : "Revisions Requested",
            message: `CEO ${decision === "APPROVED" ? "approved" : "requested revisions for"} project ${project.code}. Note: ${feedback || "No comment"}`,
            type: "APPROVAL",
            link: `/employee/projects`,
          },
        })
      ),
    ]);

    return NextResponse.json({
      success: true,
      message: decision === "APPROVED" ? "Project approved and marked completed" : "Revision request sent",
      status: newStatus,
    });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to process approval" }, { status: 500 });
  }
}
