import winston from "winston";
import morgan from "morgan";

// Cấu hình log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const level = () => {
  const env = process.env.NODE_ENV || "development";
  return env === "development" ? "debug" : "warn";
};

// Màu sắc cho log level
winston.addColors({
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "white",
});

// Định dạng log
const format = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// Transport cho Winston
const transports = [
  new winston.transports.Console(),
  new winston.transports.File({ filename: "logs/error.log", level: "error" }),
  new winston.transports.File({ filename: "logs/all.log" }),
];

// Tạo logger
const Logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
});

// Middleware Morgan cho HTTP logging
const morganMiddleware = morgan(
  ":method :url :status :res[content-length] - :response-time ms",
  {
    stream: {
      write: (message) => Logger.http(message.trim()),
    },
  }
);

export { Logger, morganMiddleware };
