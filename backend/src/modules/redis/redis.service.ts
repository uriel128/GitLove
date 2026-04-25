import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import Redis from "ioredis";
import { env } from "../../config/env";

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;

  async onModuleInit() {
    if (!env.REDIS_URL) {
      return;
    }

    this.client = new Redis(env.REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      retryStrategy: () => null
    });
    this.client.on("error", () => {
      // Redis is optional for local startup; health endpoint reports status.
    });
    try {
      await this.client.connect();
      this.logger.log("Connected to Redis");
    } catch (error) {
      this.logger.warn(`Redis unavailable: ${(error as Error).message}`);
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
    }
  }

  getClient() {
    return this.client;
  }

  async ping(): Promise<"up" | "down" | "disabled"> {
    if (!this.client) {
      return "disabled";
    }

    try {
      await this.client.ping();
      return "up";
    } catch {
      return "down";
    }
  }
}
