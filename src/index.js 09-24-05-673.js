"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const logger_1 = require("./lib/logger");
const client_1 = __importDefault(require("./prisma/client"));
const routes_1 = __importDefault(require("./routes"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Middleware
app.use(express_1.default.json());
app.use(logger_1.morganMiddleware);
app.use(routes_1.default);
// Test route
app.get("/", (req, res) => {
    logger_1.Logger.info("Hello from Winston!");
    res.send("Express + TypeScript + Prisma + PostgreSQL");
});
// Khởi động server
app.listen(PORT, () => {
    logger_1.Logger.info(`Server running at http://localhost:${PORT}`);
});
// Xử lý shutdown
process.on("SIGINT", () => __awaiter(void 0, void 0, void 0, function* () {
    yield client_1.default.$disconnect();
    logger_1.Logger.info("Prisma disconnected");
    process.exit(0);
}));
