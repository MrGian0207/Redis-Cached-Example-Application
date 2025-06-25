import { createClient } from "redis";

// Types & Interfaces
export interface RedisConfig {
  url: string;
  connectTimeout?: number;
  commandTimeout?: number;
  retryDelayOnFailover?: number;
  maxRetriesPerRequest?: number;
  keepAlive?: boolean;
  family?: number;
  password?: string;
  db?: number;
}

export interface RedisStats {
  connectedClients: number;
  usedMemory: string;
  totalCommandsProcessed: number;
  instantaneousOpsPerSec: number;
  uptime: number;
}

export interface CacheService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  del(key: string | string[]): Promise<number>;
  exists(key: string): Promise<boolean>;
  keys(pattern: string): Promise<string[]>;
  flushAll(): Promise<void>;
  healthCheck(): Promise<boolean>;
  getStats(): Promise<RedisStats>;
  disconnect(): Promise<void>;
}

export type RedisClient = ReturnType<typeof createClient>;
