import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { CreateProjectSchema } from "@/lib/validations";
import { getNextProjectCode } from "@/lib/projects";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const search = searchParams.get("search");

    const where: any = {};
    if (status && status !== "ALL") {
      where.status = status;
    }
    if (priority && priority !== "ALL") {
      where.priority = priority;
    }
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { code: { contains: search } },
        { summary: { contains: search } },
      ];
    }

    // If Employee, only show their projects
    if (session.role === "EMPLOYEE") {
      where.members = {
        some: { userId: session.id },
      };
    }

    const projects = await prisma.project.findMany({
      where,
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        tasks: true,
        _count: {
          select: { updates: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ projects });
  } catch (error: any) {
    console.error("Failed to fetch projects:", error);
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "CEO") {
      return NextResponse.json({ error: "Forbidden: Only CEO can create projects" }, { status: 403 });
    }

    const body = await request.json();
    const result = CreateProjectSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { title, summary, priority, deadline, assigneeIds, leadId } = result.data;
    const projectCode = await getNextProjectCode();

    // Auto-provision simulated Google Drive folder
    const safeTitle = title.replace(/[^a-zA-Z0-9_-]/g, "_");
    const driveFolderId = `EC_Drive_${projectCode}_${Date.now()}`;
    const driveFolderUrl = `https://drive.google.com/drive/folders/${driveFolderId}?usp=sharing`;

    const project = await prisma.project.create({
      data: {
        code: projectCode,
        title,
        summary,
        priority,
        status: "NOT_STARTED",
        progress: 0,
        deadline: new Date(deadline),
        driveFolderId,
        driveFolderUrl,
        createdById: session.id,
        members: {
          create: assigneeIds.map((userId) => ({
            userId,
            memberRole: leadId && leadId === userId ? "LEAD" : "CONTRIBUTOR",
          })),
        },
      },
      include: {
        members: { include: { user: true } },
      },
    });

    // Send notifications to assignees
    await prisma.notification.createMany({
      data: assigneeIds.map((userId) => ({
        userId,
        title: "New Project Assignment",
        message: `You have been assigned to project ${project.code}: ${project.title}. Deadline: ${new Date(deadline).toLocaleDateString()}`,
        type: "ASSIGNED",
        link: `/employee/projects`,
      })),
    });

    return NextResponse.json({ success: true, project }, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create project:", error);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}
