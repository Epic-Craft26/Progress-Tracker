const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function runEndToEndLifecycleTest() {
  console.log("=================================================");
  console.log("   EPIC CRAFT PROGRESS TRACKER E2E LIFECYCLE TEST");
  console.log("=================================================\n");

  // Step 1: Verify CEO & Employee Accounts
  const ceo = await prisma.user.findFirst({ where: { role: "CEO" } });
  const employee = await prisma.user.findFirst({ where: { role: "EMPLOYEE" } });
  if (!ceo || !employee) throw new Error("Seed accounts missing");
  console.log(`✓ Step 1: CEO (${ceo.name}) & Employee (${employee.name}) accounts verified`);

  // Step 2: CEO Creates a New Project
  const testProjectCode = `EC-E2E-${Date.now().toString().slice(-4)}`;
  const driveUrl = `https://drive.google.com/drive/folders/1Drive_${testProjectCode}_test`;

  const newProject = await prisma.project.create({
    data: {
      code: testProjectCode,
      title: "Automated End-to-End Verification Pipeline",
      summary: "Testing the entire project lifecycle from CEO assignment to employee updates and approval.",
      priority: "HIGH",
      status: "IN_PROGRESS",
      progress: 0,
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      driveFolderId: `1Drive_${testProjectCode}`,
      driveFolderUrl: driveUrl,
      createdById: ceo.id,
      members: {
        create: [{ userId: employee.id, memberRole: "LEAD" }],
      },
    },
  });
  console.log(`✓ Step 2: Project ${newProject.code} created with Drive URL: ${newProject.driveFolderUrl}`);

  // Step 3: Employee Posts Mid-Milestone Progress Update
  const update1 = await prisma.projectUpdate.create({
    data: {
      projectId: newProject.id,
      userId: employee.id,
      progress: 50,
      note: "Halfway through test implementation, components verified.",
    },
  });
  await prisma.project.update({
    where: { id: newProject.id },
    data: { progress: 50 },
  });
  console.log(`✓ Step 3: Employee logged milestone: 50%`);

  // Step 4: Employee Marks Project 100% and Submits for Review
  const update2 = await prisma.projectUpdate.create({
    data: {
      projectId: newProject.id,
      userId: employee.id,
      progress: 100,
      note: "All deliverables complete and uploaded to Drive. Submitting for CEO review.",
    },
  });
  await prisma.project.update({
    where: { id: newProject.id },
    data: { progress: 100, status: "PENDING_REVIEW" },
  });
  console.log(`✓ Step 4: Employee marked 100% & status changed to PENDING_REVIEW`);

  // Step 5: CEO Reviews and Approves Project
  await prisma.approvalReview.create({
    data: {
      projectId: newProject.id,
      reviewedById: ceo.id,
      decision: "APPROVED",
      feedback: "Verified E2E test. Outstanding work!",
    },
  });
  const approvedProject = await prisma.project.update({
    where: { id: newProject.id },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
    },
  });
  console.log(`✓ Step 5: CEO approved project. Final status: ${approvedProject.status}`);

  // Step 6: Verify Final State & Performance Stats
  const completedCheck = await prisma.project.findUnique({
    where: { id: newProject.id },
    include: { approvals: true, updates: true, members: true },
  });

  if (
    completedCheck.status !== "COMPLETED" ||
    completedCheck.progress !== 100 ||
    completedCheck.approvals.length !== 1 ||
    completedCheck.updates.length !== 2
  ) {
    throw new Error("E2E state assertion failed");
  }

  console.log("\n=================================================");
  console.log("   ALL E2E LIFECYCLE CHECKS PASSED SUCCESSFULLY!");
  console.log("=================================================");
}

runEndToEndLifecycleTest()
  .catch((e) => {
    console.error("E2E Test Failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
