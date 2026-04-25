import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { RedisService } from "../redis/redis.service";

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService
  ) {}

  async getHealth() {
    let db: "up" | "down" = "down";
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      db = "up";
    } catch {
      db = "down";
    }

    const cache = await this.redisService.ping();
    const status = db === "up" && (cache === "up" || cache === "disabled") ? "ok" : "degraded";

    return {
      status,
      services: { db, cache },
      timestamp: new Date().toISOString()
    };
  }
}
