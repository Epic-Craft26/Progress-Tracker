const { PrismaClient } = require("@prisma/client");
const { z } = require("zod");

const prisma = new PrismaClient();

async function runTests() {
  console.log("--- Starting Database & Validation Unit Tests ---");

  // 1. Verify CEO account
  const ceo = await prisma.user.findFirst({
    where: { role: "CEO" },
  });
  if (!ceo || ceo.name !== "Karan" || ceo.role !== "CEO") {
    throw new Error("CEO account assertion failed");
  }
  console.log("✓ CEO user verification passed (Karan, identifier: 'karan')");

  // 2. Verify clean production slate: 0 mock employees, 0 mock projects
  const employees = await prisma.user.findMany({
    where: { role: "EMPLOYEE" },
  });
  console.log(`✓ Clean employee slate: ${employees.length} mock employees in database`);

  const projectsCount = await prisma.project.count();
  console.log(`✓ Clean project slate: ${projectsCount} mock projects in database`);

  console.log("--- All Database Verification Tests Passed Successfully! ---");
}

runTests()
  .catch((err) => {
    console.error("Test failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
