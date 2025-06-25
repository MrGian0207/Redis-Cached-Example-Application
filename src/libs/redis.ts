import { Logger } from "@/types/logger";
import {
  CacheService,
  RedisClient,
  RedisConfig,
  RedisStats,
} from "@/types/redis";

import { createClient, SetOptions, RedisClientOptions } from "redis";

// Custom Error Classes
export class RedisConnectionError extends Error {
  constructor(message: string, public originalError?: Error) {
    super(message);
    this.name = "RedisConnectionError";
  }
}

export class RedisOperationError extends Error {
  constructor(message: string, public originalError?: Error) {
    super(message);
    this.name = "RedisOperationError";
  }
}

// Simple Console Logger Implementation
class ConsoleLogger implements Logger {
  info(message: string, meta?: any): void {
    console.log(`[INFO] ${message}`, meta ? JSON.stringify(meta) : "");
  }

  error(message: string, meta?: any): void {
    console.error(`[ERROR] ${message}`, meta ? JSON.stringify(meta) : "");
  }

  warn(message: string, meta?: any): void {
    console.warn(`[WARN] ${message}`, meta ? JSON.stringify(meta) : "");
  }

  debug(message: string, meta?: any): void {
    console.debug(`[DEBUG] ${message}`, meta ? JSON.stringify(meta) : "");
  }
}

export class RedisService implements CacheService {
  private static instance: RedisService;
  private client!: RedisClient;
  private isConnected = false;
  private isConnecting = false;
  private connectionPromise: Promise<void> | null = null;
  private logger: Logger;
  private config: RedisConfig;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;

  private constructor(config: RedisConfig, logger?: Logger) {
    this.config = config;
    this.logger = logger || new ConsoleLogger();
    this.initializeClient();
  }

  /**
   * Get singleton instance of RedisService
   */
  public static getInstance(
    config?: RedisConfig,
    logger?: Logger
  ): RedisService {
    if (!RedisService.instance) {
      if (!config) {
        throw new Error("Config is required for first initialization");
      }
      RedisService.instance = new RedisService(config, logger);
    }
    return RedisService.instance;
  }

  /**
   * Initialize Redis client with configuration
   */
  initializeClient(): void {
    const clientOptions: RedisClientOptions = {
      url: this.config.url,
      socket: {
        connectTimeout: this.config.connectTimeout || 5000,
        // lazyConnect: this.config.lazyConnect ?? true,
        keepAlive: this.config.keepAlive || false,
        family: this.config.family || 4,
        reconnectStrategy: (retries) => {
          if (retries > this.maxReconnectAttempts) {
            this.logger.error("Max reconnection attempts reached");
            return false;
          }

          const delay = Math.min(retries * 100, 3000);
          this.logger.info(
            `Reconnecting to Redis in ${delay}ms (attempt ${retries})`
          );
          return delay;
        },
      },
      password: this.config.password,
      database: this.config.db || 0,
      commandsQueueMaxLength: 1000,
    };

    this.client = createClient(clientOptions);
    this.setupEventHandlers();
  }

  /**
   * Setup Redis client event handlers
   */
  private setupEventHandlers(): void {
    this.client.on("connect", () => {
      this.logger.info("Redis client connected");
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.client.on("ready", () => {
      this.logger.info("Redis client ready");
    });

    this.client.on("error", (error) => {
      this.logger.error("Redis client error", { error: error.message });
      this.isConnected = false;
    });

    this.client.on("end", () => {
      this.logger.info("Redis client disconnected");
      this.isConnected = false;
    });

    this.client.on("reconnecting", () => {
      this.reconnectAttempts++;
      this.logger.info(
        `Redis client reconnecting (attempt ${this.reconnectAttempts})`
      );
    });
  }

  /**
   * Ensure connection is established
   */
  private async ensureConnection(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    if (this.isConnecting && this.connectionPromise) {
      return this.connectionPromise;
    }

    this.isConnecting = true;
    this.connectionPromise = this.connect();

    try {
      await this.connectionPromise;
    } finally {
      this.isConnecting = false;
      this.connectionPromise = null;
    }
  }

  /**
   * Connect to Redis server
   */
  private async connect(): Promise<void> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
        this.logger.info("Successfully connected to Redis");
      }
    } catch (error) {
      this.logger.error("Failed to connect to Redis", { error });
      throw new RedisConnectionError(
        "Failed to connect to Redis",
        error as Error
      );
    }
  }

  /**
   * Get value from Redis
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      await this.ensureConnection();
      const value = await this.client.get(key);

      if (value === null) {
        return null;
      }

      try {
        return JSON.parse(value) as T;
      } catch {
        // If JSON parsing fails, return as string
        return value as unknown as T;
      }
    } catch (error) {
      this.logger.error("Redis GET operation failed", { key, error });
      throw new RedisOperationError(
        `Failed to get key: ${key}`,
        error as Error
      );
    }
  }

  /**
   * Set value in Redis
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      await this.ensureConnection();

      const serializedValue =
        typeof value === "string" ? value : JSON.stringify(value);
      const options: SetOptions = ttl ? { EX: ttl } : {};

      await this.client.set(key, serializedValue, options);

      this.logger.debug("Redis SET operation successful", { key, ttl });
    } catch (error) {
      this.logger.error("Redis SET operation failed", { key, error });
      throw new RedisOperationError(
        `Failed to set key: ${key}`,
        error as Error
      );
    }
  }

  /**
   * Delete key(s) from Redis
   */
  async del(key: string | string[]): Promise<number> {
    try {
      await this.ensureConnection();
      const keys = Array.isArray(key) ? key : [key];
      const result = await this.client.del(keys);

      this.logger.debug("Redis DEL operation successful", {
        keys,
        deletedCount: result,
      });
      return result;
    } catch (error) {
      this.logger.error("Redis DEL operation failed", { key, error });
      throw new RedisOperationError(
        `Failed to delete key(s): ${key}`,
        error as Error
      );
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      await this.ensureConnection();
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error("Redis EXISTS operation failed", { key, error });
      throw new RedisOperationError(
        `Failed to check existence of key: ${key}`,
        error as Error
      );
    }
  }

  /**
   * Get keys matching pattern
   */
  async keys(pattern: string): Promise<string[]> {
    try {
      await this.ensureConnection();
      const keys = await this.client.keys(pattern);

      this.logger.debug("Redis KEYS operation successful", {
        pattern,
        count: keys.length,
      });
      return keys;
    } catch (error) {
      this.logger.error("Redis KEYS operation failed", { pattern, error });
      throw new RedisOperationError(
        `Failed to get keys with pattern: ${pattern}`,
        error as Error
      );
    }
  }

  /**
   * Flush all data
   */
  async flushAll(): Promise<void> {
    try {
      await this.ensureConnection();
      await this.client.flushAll();

      this.logger.info("Redis FLUSHALL operation successful");
    } catch (error) {
      this.logger.error("Redis FLUSHALL operation failed", { error });
      throw new RedisOperationError("Failed to flush all data", error as Error);
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.ensureConnection();
      const response = await this.client.ping();
      return response === "PONG";
    } catch (error) {
      this.logger.error("Redis health check failed", { error });
      return false;
    }
  }

  /**
   * Get Redis statistics
   */
  async getStats(): Promise<RedisStats> {
    try {
      await this.ensureConnection();
      const info = await this.client.info();

      return this.parseRedisInfo(info);
    } catch (error) {
      this.logger.error("Failed to get Redis stats", { error });
      throw new RedisOperationError(
        "Failed to get Redis statistics",
        error as Error
      );
    }
  }

  /**
   * Parse Redis INFO command output
   */
  private parseRedisInfo(info: string): RedisStats {
    const lines = info.split("\r\n");
    const stats: any = {};

    lines.forEach((line) => {
      if (line.includes(":")) {
        const [key, value] = line.split(":");
        stats[key] = value;
      }
    });

    return {
      connectedClients: parseInt(stats.connected_clients) || 0,
      usedMemory: stats.used_memory_human || "0B",
      totalCommandsProcessed: parseInt(stats.total_commands_processed) || 0,
      instantaneousOpsPerSec: parseInt(stats.instantaneous_ops_per_sec) || 0,
      uptime: parseInt(stats.uptime_in_seconds) || 0,
    };
  }

  /**
   * Graceful shutdown
   */
  async disconnect(): Promise<void> {
    try {
      if (this.client.isOpen) {
        await this.client.quit();
        this.logger.info("Redis client disconnected gracefully");
      }
      this.isConnected = false;
    } catch (error) {
      this.logger.error("Error during Redis disconnect", { error });
      // Force close if graceful shutdown fails
      this.client.destroy();
    }
  }

  /**
   * Force destroy connection (for emergency situations)
   */
  destroy(): void {
    this.client.destroy();
    this.isConnected = false;
    this.logger.warn("Redis connection destroyed forcefully");
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): {
    isConnected: boolean;
    isConnecting: boolean;
    reconnectAttempts: number;
  } {
    return {
      isConnected: this.isConnected,
      isConnecting: this.isConnecting,
      reconnectAttempts: this.reconnectAttempts,
    };
  }
}

// Factory function for easier usage
export function createRedisService(
  config: RedisConfig,
  logger?: Logger
): RedisService {
  return RedisService.getInstance(config, logger);
}

// Default configuration
export const defaultRedisConfig: RedisConfig = {
  url: process.env.REDIS_URL || "redis://localhost:6379",
  connectTimeout: 5000,
  commandTimeout: 5000,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  keepAlive: true,
  family: 4,
  db: 0,
};

// Export singleton instance with default config (for backward compatibility)
let defaultInstance: RedisService | null = null;

export function getDefaultRedisService(): RedisService {
  if (!defaultInstance) {
    defaultInstance = RedisService.getInstance(defaultRedisConfig);
  }
  return defaultInstance;
}

export default RedisService;
