import prisma from "../../src/prisma/client";

async function updateExistingUsers() {
  const totalUsers = await prisma.user.count();
  const CHUNK_SIZE = 5000;

  for (let skip = 0; skip < totalUsers; skip += CHUNK_SIZE) {
    const users = await prisma.user.findMany({
      skip,
      take: CHUNK_SIZE,
      select: { id: true },
    });

    const updatePromises = users.map((user) =>
      prisma.user.update({
        where: { id: user.id },
        data: {
          password: "temp_password_needs_reset",
          updatedAt: new Date(),
          // Các trường khác nếu cần
        },
      })
    );

    await Promise.all(updatePromises);
    console.log(`Đã cập nhật ${skip + users.length}/${totalUsers} bản ghi`);
  }
}

updateExistingUsers()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
