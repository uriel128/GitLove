import { Controller, Get, Query } from "@nestjs/common";
import { ChallengeService } from "./challenge.service";

@Controller("challenges")
export class ChallengeController {
  constructor(private readonly challengeService: ChallengeService) {}

  @Get("random")
  async getRandom(@Query("difficulty") difficulty?: string) {
    const parsedDifficulty = this.challengeService.parseDifficulty(difficulty);
    return this.challengeService.getRandomChallenge(parsedDifficulty);
  }
}
