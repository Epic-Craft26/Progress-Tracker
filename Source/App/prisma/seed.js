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

  // CEO Password is 2006
  const hashedCeoPassword = await bcrypt.hash("2006", 10);
  const hashedEmpPassword = await bcrypt.hash("Pass@123", 10);

  // 1. Create CEO: Karan
  const ceo = await prisma.user.create({
    data: {
      name: "Karan",
      email: "karan",
      role: "CEO",
      passwordHash: hashedCeoPassword,
      mustChangePassword: false,
    },
  });

  console.log("CEO account initialized:", {
    name: ceo.name,
    identifier: ceo.email,
    role: ceo.role,
  });

  console.log("Clean production database initialized: 0 mock employees, 0 mock projects.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
