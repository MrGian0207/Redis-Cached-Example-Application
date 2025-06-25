import { getDefaultRedisService } from "@/libs";
import prisma from "@/prisma/client";
import { User } from "@/types/model/user";
import * as bcrypt from "bcrypt";

const SALT_ROUNDS = 10;
const CACHE_EXPIRATION = 60 * 30;

class UserService {
  constructor() {}

  getAllUsers = async (page: number = 1, limit: number = 100000) => {
    const cacheKey = `users:page_${page}:limit_${limit}`;

    try {
      const cachedData = await getDefaultRedisService().get<User | null>(
        cacheKey
      );
      if (cachedData) {
        console.log(`[UserService] Lấy users từ cache với key: ${cacheKey}`);
        return cachedData;
      }

      console.log(
        `[UserService] Lấy users từ database, cache miss với key: ${cacheKey}`
      );
      const users = await prisma.user.findMany({
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
          role: true,
          status: true,
          createdAt: true,
        },
      });

      // Lưu vào cache với thời gian hết hạn
      await getDefaultRedisService().set(
        cacheKey,
        JSON.stringify(users),
        CACHE_EXPIRATION
      );

      return users;
    } catch (error) {
      console.error("Redis error:", error);
      // Fallback: vẫn trả về dữ liệu từ database nếu Redis lỗi
      console.log(
        `[UserService] Lấy users từ database do lỗi Redis với key: ${cacheKey}`
      );
      return prisma.user.findMany({
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
          role: true,
          status: true,
          createdAt: true,
        },
      });
    }
  };

  createUser = async (userData: {
    email: string;
    password: string;
    name?: string;
    phone?: string;
    avatar?: string;
    birthdate?: Date;
    address?: string;
    bio?: string;
  }) => {
    // Hash mật khẩu trước khi lưu
    const hashedPassword = await bcrypt.hash(userData.password, SALT_ROUNDS);

    return prisma.user.create({
      data: {
        email: userData.email,
        password: hashedPassword, // Lưu hash, không lưu plain text
        name: userData.name,
        phone: userData.phone,
        avatar: userData.avatar,
        birthdate: userData.birthdate,
        address: userData.address,
        bio: userData.bio,

        // Các trường có giá trị mặc định
        role: "USER", // Mặc định từ Prisma schema
        status: "ACTIVE", // Mặc định từ Prisma schema
        isEmailVerified: false, // Mặc định từ Prisma schema
        createdAt: new Date(), // Sẽ được tự động thêm bởi Prisma (@default(now()))
        updatedAt: new Date(),
      },
    });
  };

  getUserById = async (id: number) => {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        lastLogin: true,
        birthdate: true,
        address: true,
        bio: true,
        // KHÔNG trả về password
      },
    });
  };

  async invalidateUsersCache() {
    // Xóa tất cả cache liên quan đến users
    const keys = await getDefaultRedisService().keys("users:*");
    if (keys.length > 0) {
      await getDefaultRedisService().del(keys);
    }
  }
}

export default UserService;
