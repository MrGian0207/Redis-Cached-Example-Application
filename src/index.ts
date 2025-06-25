import express from "express";
import { morganMiddleware, Logger } from "./libs/logger";
import prisma from "./prisma/client";
import router from "./routes";
import dotenv from "dotenv";
import { getDefaultRedisService } from "./libs";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(morganMiddleware);

// Apply routes
app.use(router);

// Test route
app.get("/", (req, res) => {
  Logger.info("Hello from Winston!");
  res.send("Express + TypeScript + Prisma + PostgreSQL");
});

// Khởi động server
app.listen(PORT, () => {
  Logger.info(`Server running at http://localhost:${PORT}`);
});

// Xử lý shutdown
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  await getDefaultRedisService().disconnect();
  Logger.info("Prisma disconnected");
  process.exit(0);
});
