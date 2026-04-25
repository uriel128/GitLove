import { Controller, Get, Param } from "@nestjs/common";
import { AnalyticsService } from "./analytics.service";

@Controller()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get("build-log/:userId")
  buildLog(@Param("userId") userId: string) {
    return this.analyticsService.getBuildLog(userId);
  }

  @Get("stack-trace")
  stackTrace() {
    return this.analyticsService.getStackTrace();
  }
}
