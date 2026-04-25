import { Module } from "@nestjs/common";
import { AnalyticsModule } from "./modules/analytics/analytics.module";
import { AuthModule } from "./modules/auth/auth.module";
import { ChallengeModule } from "./modules/challenges/challenge.module";
import { ChatModule } from "./modules/chat/chat.module";
import { HealthModule } from "./modules/health/health.module";
import { InterestModule } from "./modules/interest/interest.module";
import { PrismaModule } from "./modules/prisma/prisma.module";
import { UsersModule } from "./modules/users/users.module";

@Module({
  imports: [
    PrismaModule,
    HealthModule,
    ChallengeModule,
    AuthModule,
    InterestModule,
    ChatModule,
    UsersModule,
    AnalyticsModule
  ]
})
export class AppModule {}
