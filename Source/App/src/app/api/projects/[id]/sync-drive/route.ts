import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { createProjectDriveFolder } from "@/lib/drive";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "CEO") {
      return NextResponse.json({ error: "Forbidden: CEO only" }, { status: 403 });
    }

    const { id } = await params;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: { select: { email: true } },
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const assigneeEmails = project.members.map((m) => m.user.email);

    const folder = await createProjectDriveFolder({
      projectCode: project.code,
      projectTitle: project.title,
      assigneeEmails,
    });

    if (!folder) {
      return NextResponse.json(
        {
          error:
            "Could not create folder on Google Drive. Please ensure the Epic Craft folder on Drive is shared with the Service Account email: epic-craft-drive@benefitbridge-488015.iam.gserviceaccount.com as Editor.",
        },
        { status: 500 }
      );
    }

    const updated = await prisma.project.update({
      where: { id },
      data: {
        driveFolderId: folder.folderId,
        driveFolderUrl: folder.folderUrl,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Folder "${project.code} - ${project.title}" created successfully on Google Drive!`,
      project: updated,
      folderUrl: folder.folderUrl,
    });
  } catch (error: any) {
    console.error("Failed to sync project drive folder:", error);
    return NextResponse.json(
      { error: "Failed to create Google Drive folder: " + error.message },
      { status: 500 }
    );
  }
}
