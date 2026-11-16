const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Checking database initialization...");

  const existingCeo = await prisma.user.findFirst({
    where: { role: "CEO" },
  });

  if (!existingCeo) {
    const hashedCeoPassword = await bcrypt.hash("2006", 10);
    const ceo = await prisma.user.create({
      data: {
        name: "Karan",
        email: "karanraj2006rk@gmail.com",
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
  } else {
    console.log("CEO account already initialized:", existingCeo.email);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
