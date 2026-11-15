import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { CreateProjectSchema } from "@/lib/validations";
import { getNextProjectCode } from "@/lib/projects";
import { createProjectDriveFolder } from "@/lib/drive";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    const where: any = {};
    if (status && status !== "ALL") {
      where.status = status;
    }
    if (priority && priority !== "ALL") {
      where.priority = priority;
    }
    if (category && category !== "ALL") {
      where.category = category;
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
        tasks: {
          orderBy: { createdAt: "asc" },
        },
        updates: {
          include: { user: { select: { id: true, name: true, email: true } } },
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: { updates: true, tasks: true },
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
      return NextResponse.json(
        { error: "Forbidden: Only CEO can create projects" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const result = CreateProjectSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const {
      title,
      summary,
      category,
      priority,
      startDate,
      deadline,
      assigneeIds,
      leadId,
      driveFolderUrl: customDriveUrl,
      tasks,
    } = result.data;
    const projectCode = await getNextProjectCode();
    const uniqueAssigneeIds = Array.from(new Set(assigneeIds));

    // Fetch assignee emails for automatic Drive permission sharing
    const assignees = await prisma.user.findMany({
      where: { id: { in: uniqueAssigneeIds } },
      select: { email: true },
    });
    const assigneeEmails = assignees.map((a) => a.email);

    // Default master drive settings
    const defaultMasterDrive =
      process.env.GOOGLE_DRIVE_MASTER_FOLDER_URL ||
      "https://drive.google.com/drive/folders/1BisxzQ0xkseowtbaTe5FNhtTCRE8JFJf?usp=drive_link";
    const masterFolderId =
      process.env.GOOGLE_DRIVE_MASTER_FOLDER_ID ||
      "1BisxzQ0xkseowtbaTe5FNhtTCRE8JFJf";

    let driveFolderId = masterFolderId;
    let driveFolderUrl = customDriveUrl?.trim()
      ? customDriveUrl.trim()
      : defaultMasterDrive;

    // Attempt automated Google Drive folder creation via Service Account
    try {
      const createdFolder = await createProjectDriveFolder({
        projectCode,
        projectTitle: title,
        assigneeEmails,
        masterFolderId,
      });

      if (createdFolder) {
        driveFolderId = createdFolder.folderId;
        driveFolderUrl = createdFolder.folderUrl;
        console.log(`[Google Drive] Created folder ${projectCode} - ${title}: ${driveFolderUrl}`);
      }
    } catch (driveErr) {
      console.warn("[Google Drive] Automated folder creation skipped:", driveErr);
    }

    const project = await prisma.project.create({
      data: {
        code: projectCode,
        title,
        summary,
        category: category || "General",
        priority,
        status: "NOT_STARTED",
        progress: 0,
        startDate: startDate ? new Date(startDate) : new Date(),
        deadline: new Date(deadline),
        driveFolderId,
        driveFolderUrl,
        createdById: session.id,
        members: {
          create: uniqueAssigneeIds.map((userId) => ({
            userId,
            memberRole: leadId && leadId === userId ? "LEAD" : "CONTRIBUTOR",
          })),
        },
        tasks:
          tasks && tasks.length > 0
            ? {
                create: tasks.map((t) => ({
                  title: t.title,
                  dueDate: t.dueDate ? new Date(t.dueDate) : null,
                  assignedToId: leadId || assigneeIds[0],
                })),
              }
            : undefined,
      },
      include: {
        members: { include: { user: true } },
        tasks: true,
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
