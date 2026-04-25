import { Module } from "@nestjs/common";
import { AnalyticsModule } from "./modules/analytics/analytics.module";
import { ChallengeModule } from "./modules/challenges/challenge.module";
import { ChatModule } from "./modules/chat/chat.module";
import { HealthModule } from "./modules/health/health.module";
import { InterestModule } from "./modules/interest/interest.module";
import { PrismaModule } from "./modules/prisma/prisma.module";
import { RedisModule } from "./modules/redis/redis.module";
import { UsersModule } from "./modules/users/users.module";

@Module({
  imports: [
    PrismaModule,
    RedisModule,
    HealthModule,
    ChallengeModule,
    InterestModule,
    ChatModule,
    UsersModule,
    AnalyticsModule
  ]
})
export class AppModule {}
