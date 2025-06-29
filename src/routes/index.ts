import { Router } from "express";
import userController from "../controllers/user.controller";

const router = Router();

router.get("/users", userController.getAllUsers);
router.post("/users", userController.createUser);
router.get("/users/:id", userController.getUserById);

export default router;
