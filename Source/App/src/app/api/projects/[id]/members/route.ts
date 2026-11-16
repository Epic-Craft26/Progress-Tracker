import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { AddProjectMemberSchema } from "@/lib/validations";
import { grantDriveFolderAccess } from "@/lib/drive";

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
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                designation: true,
                department: true,
                isActive: true,
              },
            },
          },
        },
        tasks: {
          select: {
            id: true,
            assignedToId: true,
            isCompleted: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Map members with their active task counts
    const membersWithStats = project.members.map((m) => {
      const assignedTasks = project.tasks.filter((t) => t.assignedToId === m.userId);
      const pendingTasks = assignedTasks.filter((t) => !t.isCompleted);
      return {
        id: m.id,
        userId: m.userId,
        memberRole: m.memberRole,
        assignedAt: m.assignedAt,
        user: m.user,
        totalTasks: assignedTasks.length,
        pendingTasks: pendingTasks.length,
      };
    });

    return NextResponse.json({ members: membersWithStats });
  } catch (err: any) {
    console.error("Failed to load project members:", err);
    return NextResponse.json(
      { error: "Failed to load project members" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "CEO") {
      return NextResponse.json(
        { error: "Forbidden: Only CEO can assign members to live projects" },
        { status: 403 }
      );
    }

    const { id: projectId } = await params;
    const body = await request.json();
    const result = AddProjectMemberSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { userId, memberRole } = result.data;

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Verify user exists and is active
    const employee = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!employee || !employee.isActive) {
      return NextResponse.json(
        { error: "Employee not found or is inactive" },
        { status: 404 }
      );
    }

    // Check if already a member
    const existingMember = project.members.find((m) => m.userId === userId);
    if (existingMember) {
      return NextResponse.json(
        { error: `${employee.name} is already assigned to this project` },
        { status: 400 }
      );
    }

    const operations: any[] = [];

    // If making this member LEAD, downgrade previous LEAD to CONTRIBUTOR
    if (memberRole === "LEAD") {
      operations.push(
        prisma.projectMember.updateMany({
          where: { projectId, memberRole: "LEAD" },
          data: { memberRole: "CONTRIBUTOR" },
        })
      );
    }

    // Create the ProjectMember entry
    operations.push(
      prisma.projectMember.create({
        data: {
          projectId,
          userId,
          memberRole: memberRole || "CONTRIBUTOR",
        },
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
      })
    );

    // Create notification for employee
    operations.push(
      prisma.notification.create({
        data: {
          userId,
          title: `Assigned to ${project.title}`,
          message: `CEO ${session.name} added you to project "${project.title}" (${project.code}) as ${
            memberRole === "LEAD" ? "Project Lead" : "Contributor"
          }.`,
          type: "ASSIGNED",
          link: "/employee",
        },
      })
    );

    // Create audit log in ProjectUpdate
    operations.push(
      prisma.projectUpdate.create({
        data: {
          projectId,
          userId: session.id,
          progress: project.progress,
          note: `CEO added ${employee.name} (${employee.email}) to the project team as ${
            memberRole === "LEAD" ? "Project Lead" : "Contributor"
          }.`,
        },
      })
    );

    const txResults = await prisma.$transaction(operations);
    const newMember = txResults[memberRole === "LEAD" ? 1 : 0];

    // Grant Google Drive folder permission if folder exists and employee has email
    if (project.driveFolderId && employee.email) {
      grantDriveFolderAccess(project.driveFolderId, employee.email, "writer").catch(
        (e) => console.warn("Google Drive permission background grant failed:", e)
      );
    }

    return NextResponse.json({
      success: true,
      message: `${employee.name} successfully added to ${project.title}`,
      member: newMember,
    });
  } catch (err: any) {
    console.error("Failed to add project member:", err);
    return NextResponse.json(
      { error: err.message || "Failed to add team member" },
      { status: 500 }
    );
  }
}
