import { PrismaClient, UserRole, UserStatus } from "@prisma/client";
import { faker } from "@faker-js/faker";

const prisma = new PrismaClient();

async function main() {
  const TOTAL = 500000;
  const CHUNK_SIZE = 10000; // Giảm chunk size để tránh quá tải

  // Hàm tạo user giả lập với đầy đủ trường
  const createFakeUser = () => {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();

    return {
      email: faker.internet.email({ firstName, lastName }),
      name: `${firstName} ${lastName}`,
      password: "temp_password_needs_reset", // Mật khẩu tạm
      phone: faker.phone.number(),
      avatar: faker.image.avatar(),
      birthdate: faker.date.birthdate({ mode: "age", min: 18, max: 90 }),
      address: faker.location.streetAddress(),
      bio: faker.lorem.sentence(),
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
      isEmailVerified: false,
      createdAt: faker.date.past({ years: 2 }), // Ngày tạo trong 2 năm gần đây
      updatedAt: faker.date.recent(), // Ngày cập nhật gần đây
      lastLogin: faker.datatype.boolean() ? faker.date.recent() : null,
    };
  };

  // Tạo và chèn dữ liệu theo chunk
  for (let i = 0; i < TOTAL; i += CHUNK_SIZE) {
    const chunkSize = Math.min(CHUNK_SIZE, TOTAL - i);
    const users = Array.from({ length: chunkSize }, createFakeUser);

    await prisma.user.createMany({
      data: users,
      skipDuplicates: true, // Bỏ qua email trùng
    });

    console.log(`Đã chèn ${i + chunkSize}/${TOTAL} bản ghi`);
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
