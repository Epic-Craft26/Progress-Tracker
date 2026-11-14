import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { CreateEmployeeSchema } from "@/lib/validations";
import { getNextEmployeeId } from "@/lib/projects";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const employees = await prisma.user.findMany({
      where: { role: "EMPLOYEE" },
      select: {
        id: true,
        employeeId: true,
        name: true,
        email: true,
        isActive: true,
        createdAt: true,
        assignedProjects: {
          include: {
            project: {
              select: {
                id: true,
                code: true,
                title: true,
                status: true,
                progress: true,
              },
            },
          },
        },
      },
      orderBy: { employeeId: "asc" },
    });

    const formatted = employees.map((emp) => {
      const activeCount = emp.assignedProjects.filter(
        (ap) => ap.project.status === "IN_PROGRESS"
      ).length;
      const completedCount = emp.assignedProjects.filter(
        (ap) => ap.project.status === "COMPLETED"
      ).length;

      return {
        ...emp,
        stats: {
          activeCount,
          completedCount,
          totalAssigned: emp.assignedProjects.length,
        },
      };
    });

    return NextResponse.json({ employees: formatted });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch employees" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "CEO") {
      return NextResponse.json({ error: "Forbidden: Only CEO can add employees" }, { status: 403 });
    }

    const body = await request.json();
    const result = CreateEmployeeSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { name, email, initialPassword } = result.data;

    // Check duplicate email
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "An employee with this Google Drive email already exists" },
        { status: 400 }
      );
    }

    const employeeId = await getNextEmployeeId();
    const passwordHash = await bcrypt.hash(initialPassword, 10);

    const newEmployee = await prisma.user.create({
      data: {
        employeeId,
        name,
        email,
        role: "EMPLOYEE",
        passwordHash,
        mustChangePassword: true, // Force change on first login
      },
    });

    return NextResponse.json(
      {
        success: true,
        employee: {
          id: newEmployee.id,
          employeeId: newEmployee.employeeId,
          name: newEmployee.name,
          email: newEmployee.email,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to create employee" }, { status: 500 });
  }
}
