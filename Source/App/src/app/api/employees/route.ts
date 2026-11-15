import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { CreateEmployeeSchema } from "@/lib/validations";

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
        name: true,
        email: true,
        designation: true,
        department: true,
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
      orderBy: { name: "asc" },
    });

    const formatted = employees.map((emp) => {
      const activeCount = emp.assignedProjects.filter(
        (ap) =>
          ap.project.status === "IN_PROGRESS" ||
          ap.project.status === "NOT_STARTED" ||
          ap.project.status === "REVISION_REQUESTED"
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
      return NextResponse.json(
        { error: "Forbidden: Only CEO can add employees" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const result = CreateEmployeeSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { name, email, designation, department } = result.data;
    const initialPassword =
      result.data.initialPassword ||
      `EC-${Math.random().toString(36).slice(-4).toUpperCase()}${Math.floor(1000 + Math.random() * 9000)}`;

    // Check duplicate email
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "An employee with this Google Drive email already exists" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(initialPassword, 10);

    const newEmployee = await prisma.user.create({
      data: {
        name,
        email,
        designation: designation || "Team Contributor",
        department: department || "Operations",
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
          name: newEmployee.name,
          email: newEmployee.email,
          designation: newEmployee.designation,
          department: newEmployee.department,
        },
        temporaryKey: initialPassword,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to create employee" }, { status: 500 });
  }
}
