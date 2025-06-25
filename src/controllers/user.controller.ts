import { Logger } from "@/libs/logger";
import { UserService } from "@/services";
import { Request, Response } from "express";

class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  getAllUsers = async (req: Request, res: Response): Promise<void> => {
    try {
      const users = await this.userService.getAllUsers();
      res.json(users);
    } catch (error) {
      Logger.error(`Error fetching users: ${error}`);
      res.status(500).json({ error: "Internal server error" });
    }
  };

  createUser = async (req: Request, res: Response): Promise<void> => {
    const {
      email,
      password, // Thêm password (bắt buộc)
      name,
      phone,
      avatar,
      birthdate,
      address,
      bio,
    } = req.body;

    // Kiểm tra trường bắt buộc
    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    try {
      // Gọi service với đầy đủ tham số
      const newUser = await this.userService.createUser({
        email,
        password,
        name,
        phone,
        avatar,
        birthdate: birthdate ? new Date(birthdate) : undefined,
        address,
        bio,
      });

      // Loại bỏ trường nhạy cảm trước khi trả về
      const { password: _, ...safeUser } = newUser;

      res.status(201).json(safeUser);
    } catch (error) {
      Logger.error(`Error creating user: ${error}`);

      // Xử lý lỗi email trùng lặp
      if (error instanceof Error && error.message.includes("P2002")) {
        res.status(409).json({ error: "Email already exists" });
        return;
      }

      res.status(500).json({ error: "Internal server error" });
    }
  };

  getUserById = async (req: Request, res: Response): Promise<void> => {
    const userId = parseInt(req.params.id);

    if (isNaN(userId)) {
      res.status(400).json({ error: "Invalid user ID" });
      return;
    }

    try {
      const user = await this.userService.getUserById(userId);
      user ? res.json(user) : res.status(404).json({ error: "User not found" });
    } catch (error) {
      Logger.error(`Error fetching user: ${error}`);
      res.status(500).json({ error: "Internal server error" });
    }
  };
}

export default new UserController();
