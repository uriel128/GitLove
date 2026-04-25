import { BadRequestException, Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { z } from "zod";
import { InterestService } from "./interest.service";

const openRequestBodySchema = z.object({
  challengerId: z.string().min(1),
  targetId: z.string().min(1)
});

const submitAttemptBodySchema = z.object({
  userId: z.string().min(1),
  passed: z.boolean(),
  submittedCode: z.string().optional()
});

@Controller()
export class InterestController {
  constructor(private readonly interestService: InterestService) {}

  @Post("interest/open")
  async open(@Body() body: unknown) {
    const parsed = openRequestBodySchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException("Invalid body: challengerId and targetId are required");
    }

    return this.interestService.openRequest(parsed.data.challengerId, parsed.data.targetId);
  }

  @Post("interest/:requestId/attempt")
  async attempt(@Param("requestId") requestId: string, @Body() body: unknown) {
    const parsed = submitAttemptBodySchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException("Invalid body: userId and passed are required");
    }

    return this.interestService.submitAttempt(
      requestId,
      parsed.data.userId,
      parsed.data.passed,
      parsed.data.submittedCode
    );
  }

  @Post("interest/:requestId/cancel")
  async cancel(@Param("requestId") requestId: string, @Body("challengerId") challengerId: string) {
    return this.interestService.cancelRequest(requestId, challengerId);
  }

  @Get("interest/pending/:userId")
  async pending(@Param("userId") userId: string) {
    return this.interestService.getPendingForUser(userId);
  }

  @Get("matches/:userId")
  async matches(@Param("userId") userId: string, @Query("includeRoom") includeRoom?: string) {
    const matches = await this.interestService.getMatchesForUser(userId);
    if (includeRoom !== "false") {
      return matches;
    }

    return matches.map(({ room, ...match }) => match);
  }
}
