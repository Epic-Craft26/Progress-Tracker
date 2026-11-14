import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "CEO") {
      return NextResponse.json({ error: "Forbidden: CEO only" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "csv";

    const projects = await prisma.project.findMany({
      include: {
        members: { include: { user: true } },
        createdBy: true,
      },
      orderBy: { createdAt: "desc" },
    });

    if (format === "json") {
      return NextResponse.json({ projects });
    }

    // CSV format
    const header = [
      "Project Code",
      "Title",
      "Priority",
      "Status",
      "Progress %",
      "Deadline",
      "Assignees",
      "Drive URL",
    ];

    const rows = projects.map((p) => [
      `"${p.code}"`,
      `"${p.title.replace(/"/g, '""')}"`,
      `"${p.priority}"`,
      `"${p.status}"`,
      p.progress,
      `"${new Date(p.deadline).toISOString().split("T")[0]}"`,
      `"${p.members.map((m) => m.user.name).join("; ")}"`,
      `"${p.driveFolderUrl || ""}"`,
    ]);

    const csvContent = [header.join(","), ...rows.map((r) => r.join(","))].join("\n");

    return new Response(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="EpicCraft_Projects_Report_${Date.now()}.csv"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
