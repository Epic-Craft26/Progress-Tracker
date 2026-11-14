const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Clean existing data
  await prisma.notification.deleteMany();
  await prisma.approvalReview.deleteMany();
  await prisma.projectUpdate.deleteMany();
  await prisma.task.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  const hashedCeoPassword = await bcrypt.hash("Admin@123", 10);
  const hashedEmpPassword = await bcrypt.hash("Pass@123", 10);

  // 1. Create CEO
  const ceo = await prisma.user.create({
    data: {
      employeeId: "EC-0001",
      name: "Rajesh Sharma",
      email: "ceo@epiccraft.com",
      role: "CEO",
      passwordHash: hashedCeoPassword,
      mustChangePassword: false,
    },
  });

  // 2. Create Employees
  const emp1 = await prisma.user.create({
    data: {
      employeeId: "EC-0002",
      name: "Arun Kumar",
      email: "arun.epiccraft@gmail.com",
      role: "EMPLOYEE",
      passwordHash: hashedEmpPassword,
      mustChangePassword: false,
    },
  });

  const emp2 = await prisma.user.create({
    data: {
      employeeId: "EC-0003",
      name: "Priya Patel",
      email: "priya.epiccraft@gmail.com",
      role: "EMPLOYEE",
      passwordHash: hashedEmpPassword,
      mustChangePassword: false,
    },
  });

  const emp3 = await prisma.user.create({
    data: {
      employeeId: "EC-0004",
      name: "Vikram Mehta",
      email: "vikram.epiccraft@gmail.com",
      role: "EMPLOYEE",
      passwordHash: hashedEmpPassword,
      mustChangePassword: true,
    },
  });

  console.log("Created users:", { ceo: ceo.employeeId, emp1: emp1.employeeId, emp2: emp2.employeeId, emp3: emp3.employeeId });

  // 3. Create Sample Projects
  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const pastDate = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);

  // Project 1: In Progress
  const p1 = await prisma.project.create({
    data: {
      code: "EC-PRJ-001",
      title: "Epic Craft Brand Portal Redesign",
      summary: "Modernize customer-facing brand storefront with responsive design tokens and dynamic showcase.",
      priority: "HIGH",
      status: "IN_PROGRESS",
      progress: 65,
      deadline: nextWeek,
      driveFolderId: "1DriveMockFolder_BrandPortal",
      driveFolderUrl: "https://drive.google.com/drive/folders/1DriveMockFolder_BrandPortal",
      createdById: ceo.id,
      members: {
        create: [
          { userId: emp1.id, memberRole: "LEAD" },
          { userId: emp2.id, memberRole: "CONTRIBUTOR" },
        ],
      },
      tasks: {
        create: [
          { title: "Design system token alignment in Figma", isCompleted: true, assignedToId: emp1.id },
          { title: "Responsive hero section and header", isCompleted: true, assignedToId: emp1.id },
          { title: "Product showcase grid integration", isCompleted: false, assignedToId: emp2.id },
          { title: "Mobile navigation drawer and touch gestures", isCompleted: false, assignedToId: emp2.id },
        ],
      },
      updates: {
        create: [
          {
            userId: emp1.id,
            progress: 35,
            note: "Completed initial color token alignment and base typography in Tailwind.",
          },
          {
            userId: emp1.id,
            progress: 65,
            note: "Built hero section with live preview. Uploaded wireframe screenshots to Google Drive.",
            attachments: "https://drive.google.com/drive/folders/1DriveMockFolder_BrandPortal",
          },
        ],
      },
    },
  });

  // Project 2: Pending CEO Review
  const p2 = await prisma.project.create({
    data: {
      code: "EC-PRJ-002",
      title: "Inventory Sync Pipeline Automation",
      summary: "Automated webhook script to synchronize warehouse inventory levels with internal dashboard.",
      priority: "URGENT",
      status: "PENDING_REVIEW",
      progress: 100,
      deadline: now,
      driveFolderId: "1DriveMockFolder_InventorySync",
      driveFolderUrl: "https://drive.google.com/drive/folders/1DriveMockFolder_InventorySync",
      createdById: ceo.id,
      members: {
        create: [{ userId: emp2.id, memberRole: "LEAD" }],
      },
      tasks: {
        create: [
          { title: "Webhook endpoint for webhook payloads", isCompleted: true, assignedToId: emp2.id },
          { title: "Rate limiting & retry logic", isCompleted: true, assignedToId: emp2.id },
          { title: "Production staging verification", isCompleted: true, assignedToId: emp2.id },
        ],
      },
      updates: {
        create: [
          {
            userId: emp2.id,
            progress: 100,
            note: "All sync tests passed. Webhook staging load test completed with zero dropouts. Submitted for CEO sign-off.",
            attachments: "https://drive.google.com/drive/folders/1DriveMockFolder_InventorySync",
          },
        ],
      },
    },
  });

  // Project 3: Completed Project
  const p3 = await prisma.project.create({
    data: {
      code: "EC-PRJ-003",
      title: "Q3 Analytics & Revenue Report Generator",
      summary: "Export PDF and Excel summaries of quarterly project milestones and completion rates.",
      priority: "MEDIUM",
      status: "COMPLETED",
      progress: 100,
      deadline: pastDate,
      completedAt: pastDate,
      driveFolderId: "1DriveMockFolder_AnalyticsQ3",
      driveFolderUrl: "https://drive.google.com/drive/folders/1DriveMockFolder_AnalyticsQ3",
      createdById: ceo.id,
      members: {
        create: [{ userId: emp1.id, memberRole: "LEAD" }],
      },
      approvals: {
        create: {
          reviewedById: ceo.id,
          decision: "APPROVED",
          feedback: "Excellent work delivering the automated report generation before quarter end.",
        },
      },
    },
  });

  // Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: ceo.id,
        title: "New Project Submission",
        message: "Priya Patel marked EC-PRJ-002 as 100% complete. Waiting for your approval.",
        type: "APPROVAL",
        link: "/ceo/approvals",
      },
      {
        userId: emp1.id,
        title: "Project Assignment",
        message: "You have been assigned as LEAD on Epic Craft Brand Portal Redesign.",
        type: "ASSIGNED",
        link: "/employee/projects",
      },
    ],
  });

  console.log("Database seeded successfully with 3 projects and sample notifications!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
