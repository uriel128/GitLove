import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { ChallengeDifficulty } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ChallengeService {
  constructor(private readonly prisma: PrismaService) {}

  parseDifficulty(value: string | undefined) {
    if (!value) {
      throw new BadRequestException("difficulty is required");
    }

    const normalized = value.toUpperCase();
    if (!Object.values(ChallengeDifficulty).includes(normalized as ChallengeDifficulty)) {
      throw new BadRequestException("difficulty must be EASY, MEDIUM, or HARD");
    }

    return normalized as ChallengeDifficulty;
  }

  async getRandomChallenge(difficulty: ChallengeDifficulty) {
    const total = await this.prisma.challenge.count({ where: { difficulty } });
    if (total === 0) {
      throw new NotFoundException("No challenge available for this difficulty");
    }

    const skip = Math.floor(Math.random() * total);
    const challenge = await this.prisma.challenge.findFirst({
      where: { difficulty },
      skip,
      select: {
        id: true,
        slug: true,
        title: true,
        difficulty: true,
        description: true,
        starterCode: true,
        testCases: true
      }
    });

    if (!challenge) {
      throw new NotFoundException("Challenge not found");
    }

    return challenge;
  }
}
