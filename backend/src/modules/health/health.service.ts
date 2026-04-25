import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async getHealth() {
    let db: "up" | "down" = "down";
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      db = "up";
    } catch {
      db = "down";
    }

    const status = db === "up" ? "ok" : "degraded";

    return {
      status,
      services: { db },
      timestamp: new Date().toISOString()
    };
  }
}
