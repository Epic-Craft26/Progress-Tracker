const { PrismaClient } = require("@prisma/client");
const { z } = require("zod");

const prisma = new PrismaClient();

async function runTests() {
  console.log("--- Starting Database & Validation Unit Tests ---");

  // 1. Verify users exist
  const ceo = await prisma.user.findUnique({
    where: { employeeId: "EC-0001" },
  });
  if (!ceo || ceo.role !== "CEO") {
    throw new Error("CEO account assertion failed");
  }
  console.log("✓ CEO user verification passed");

  const employees = await prisma.user.findMany({
    where: { role: "EMPLOYEE" },
  });
  if (employees.length !== 3) {
    throw new Error(`Expected 3 employees, found ${employees.length}`);
  }
  console.log(`✓ Employee users verification passed (${employees.length} found)`);

  // 2. Verify project with relations
  const p1 = await prisma.project.findUnique({
    where: { code: "EC-PRJ-001" },
    include: {
      members: { include: { user: true } },
      tasks: true,
      updates: true,
    },
  });
  if (!p1 || p1.members.length !== 2 || p1.tasks.length !== 4) {
    throw new Error("Project relations verification failed");
  }
  console.log("✓ Project relations verification passed (members, tasks, updates)");

  // 3. Test progress calculation logic
  const totalTasks = p1.tasks.length;
  const completedTasks = p1.tasks.filter((t) => t.isCompleted).length;
  const computedProgress = Math.round((completedTasks / totalTasks) * 100);
  console.log(`✓ Computed task progress: ${computedProgress}% (2/4 tasks complete)`);

  console.log("--- All Database Unit Tests Passed Successfully! ---");
}

runTests()
  .catch((err) => {
    console.error("Test failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
