import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { UpdateEmployeeSchema } from "@/lib/validations";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "CEO") {
      return NextResponse.json(
        { error: "Forbidden: Only CEO can manage employees" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const result = UpdateEmployeeSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    if (user.role === "CEO") {
      return NextResponse.json(
        { error: "Cannot modify CEO account through this endpoint" },
        { status: 400 }
      );
    }

    const { action, name, email, designation, department, isActive } = result.data;

    if (action === "RESET_PASSWORD") {
      const temporaryKey = `EC-${Math.random()
        .toString(36)
        .slice(-4)
        .toUpperCase()}${Math.floor(1000 + Math.random() * 9000)}`;
      const passwordHash = await bcrypt.hash(temporaryKey, 10);

      await prisma.user.update({
        where: { id },
        data: {
          passwordHash,
          mustChangePassword: true,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Password reset successfully for ${user.name}`,
        temporaryKey,
        employeeName: user.name,
        employeeEmail: user.email,
      });
    }

    if (action === "TOGGLE_ACTIVE") {
      const updated = await prisma.user.update({
        where: { id },
        data: {
          isActive: !user.isActive,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Employee ${user.name} is now ${updated.isActive ? "active" : "deactivated"}`,
        isActive: updated.isActive,
      });
    }

    // Default UPDATE action
    const updateData: any = {};
    if (name) updateData.name = name;
    if (email && email !== user.email) {
      const duplicate = await prisma.user.findUnique({ where: { email } });
      if (duplicate) {
        return NextResponse.json(
          { error: "Another employee with this email already exists" },
          { status: 400 }
        );
      }
      updateData.email = email;
    }
    if (designation !== undefined) updateData.designation = designation;
    if (department !== undefined) updateData.department = department;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: "Employee profile updated successfully",
      employee: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        designation: updated.designation,
        department: updated.department,
        isActive: updated.isActive,
      },
    });
  } catch (error: any) {
    console.error("Failed to manage employee:", error);
    return NextResponse.json({ error: "Failed to update employee" }, { status: 500 });
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
        { error: "Forbidden: Only CEO can remove employees" },
        { status: 403 }
      );
    }

    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        assignedProjects: true,
        updates: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    if (user.role === "CEO") {
      return NextResponse.json(
        { error: "Cannot delete the CEO account" },
        { status: 400 }
      );
    }

    // If employee has logged work updates, soft-deactivate and unassign to preserve project history
    if (user.updates.length > 0) {
      await prisma.$transaction([
        prisma.notification.deleteMany({ where: { userId: id } }),
        prisma.projectMember.deleteMany({ where: { userId: id } }),
        prisma.task.updateMany({
          where: { assignedToId: id },
          data: { assignedToId: null },
        }),
        prisma.user.update({
          where: { id },
          data: { isActive: false },
        }),
      ]);

      return NextResponse.json({
        success: true,
        message: `Employee ${user.name} has existing project updates. Account was deactivated and unassigned to preserve project history.`,
      });
    }

    // If no past project updates, perform full delete
    await prisma.$transaction([
      prisma.notification.deleteMany({ where: { userId: id } }),
      prisma.projectMember.deleteMany({ where: { userId: id } }),
      prisma.task.updateMany({
        where: { assignedToId: id },
        data: { assignedToId: null },
      }),
      prisma.user.delete({ where: { id } }),
    ]);

    return NextResponse.json({
      success: true,
      message: `Employee ${user.name} was successfully removed`,
    });
  } catch (error: any) {
    console.error("Failed to remove employee:", error);
    return NextResponse.json({ error: "Failed to remove employee" }, { status: 500 });
  }
}
