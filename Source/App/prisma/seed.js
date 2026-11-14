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
      email: "karan@epiccraft.com",
      role: "CEO",
      passwordHash: hashedCeoPassword,
      mustChangePassword: false,
    },
  });

  // 2. Create Employees
  const emp1 = await prisma.user.create({
    data: {
      name: "Arun Kumar",
      email: "arun.epiccraft@gmail.com",
      role: "EMPLOYEE",
      passwordHash: hashedEmpPassword,
      mustChangePassword: false,
    },
  });

  const emp2 = await prisma.user.create({
    data: {
      name: "Priya Patel",
      email: "priya.epiccraft@gmail.com",
      role: "EMPLOYEE",
      passwordHash: hashedEmpPassword,
      mustChangePassword: false,
    },
  });

  const emp3 = await prisma.user.create({
    data: {
      name: "Vikram Mehta",
      email: "vikram.epiccraft@gmail.com",
      role: "EMPLOYEE",
      passwordHash: hashedEmpPassword,
      mustChangePassword: true,
    },
  });

  console.log("Users initialized:", {
    ceo: `${ceo.name} (${ceo.email})`,
    emp1: `${emp1.name} (${emp1.email})`,
    emp2: `${emp2.name} (${emp2.email})`,
    emp3: `${emp3.name} (${emp3.email})`,
  });

  console.log("Clean production database initialized: 0 projects, 0 mock tasks. Ready for project creation.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
