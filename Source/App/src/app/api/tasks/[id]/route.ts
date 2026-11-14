import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { isCompleted } = body;

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            tasks: true,
            members: true,
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Check authorization
    if (session.role === "EMPLOYEE") {
      const isMember = task.project.members.some((m) => m.userId === session.id);
      if (!isMember) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: { isCompleted: Boolean(isCompleted) },
    });

    // Auto-calculate project progress based on task completions
    const allTasks = task.project.tasks.map((t) =>
      t.id === id ? updatedTask : t
    );
    const completedCount = allTasks.filter((t) => t.isCompleted).length;
    const autoProgress = Math.round((completedCount / allTasks.length) * 100);

    const updatedProject = await prisma.project.update({
      where: { id: task.projectId },
      data: { progress: autoProgress },
    });

    return NextResponse.json({
      success: true,
      task: updatedTask,
      projectProgress: autoProgress,
    });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}
