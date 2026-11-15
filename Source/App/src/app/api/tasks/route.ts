import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, title, dueDate, assignedToId } = body;

    if (!projectId || !title?.trim()) {
      return NextResponse.json(
        { error: "Project ID and task title are required" },
        { status: 400 }
      );
    }

    let parsedDueDate: Date | null = null;
    if (dueDate) {
      const parsed = Date.parse(dueDate);
      if (isNaN(parsed)) {
        return NextResponse.json(
          { error: "Invalid task due date format" },
          { status: 400 }
        );
      }
      parsedDueDate = new Date(parsed);
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: true,
        tasks: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Only CEO or members can add tasks
    if (
      session.role !== "CEO" &&
      !project.members.some((m) => m.userId === session.id)
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const task = await prisma.task.create({
      data: {
        projectId,
        title: title.trim(),
        dueDate: parsedDueDate,
        assignedToId: assignedToId || session.id,
      },
      include: {
        assignedTo: { select: { id: true, name: true } },
      },
    });

    // Recalculate project progress
    const allTasks = [...project.tasks, task];
    const completedCount = allTasks.filter((t) => t.isCompleted).length;
    const autoProgress = Math.round((completedCount / allTasks.length) * 100);

    await prisma.project.update({
      where: { id: projectId },
      data: { progress: autoProgress },
    });

    return NextResponse.json(
      { success: true, task, projectProgress: autoProgress },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Failed to create task:", error);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}
