import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { ChallengeDifficulty, RequestStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class InterestService {
  constructor(private readonly prisma: PrismaService) {}

  async openRequest(challengerId: string, targetId: string) {
    if (challengerId === targetId) {
      throw new BadRequestException("You cannot request yourself");
    }

    const challenger = await this.prisma.user.findUnique({
      where: { id: challengerId },
      include: { profile: true }
    });
    if (!challenger) {
      throw new NotFoundException("Challenger not found");
    }

    const target = await this.prisma.user.findUnique({ where: { id: targetId } });
    if (!target) {
      throw new NotFoundException("Target user not found");
    }

    const difficulty = challenger.profile?.challengeLevel ?? ChallengeDifficulty.EASY;
    const challenge = await this.getRandomChallengeByDifficulty(difficulty);

    const request = await this.prisma.interestRequest.create({
      data: {
        challengerId,
        targetId,
        challengeId: challenge.id,
        status: RequestStatus.PENDING_CHALLENGER
      },
      include: { challenge: true }
    });

    return request;
  }

  async submitAttempt(
    requestId: string,
    userId: string,
    passed: boolean,
    submittedCode?: string
  ) {
    return this.prisma.$transaction(async (tx) => {
      const request = await tx.interestRequest.findUnique({
        where: { id: requestId },
        include: { attempts: true }
      });

      if (!request) {
        throw new NotFoundException("Request not found");
      }

      if (
        request.status === RequestStatus.MATCHED ||
        request.status === RequestStatus.FAILED ||
        request.status === RequestStatus.CANCELLED
      ) {
        throw new BadRequestException("Request already finalized");
      }

      if (request.attempts.some((attempt) => attempt.userId === userId)) {
        throw new BadRequestException("One attempt already used for this request");
      }

      const isChallenger = request.challengerId === userId;
      const isTarget = request.targetId === userId;
      if (!isChallenger && !isTarget) {
        throw new ForbiddenException("User is not part of this request");
      }

      if (request.status === RequestStatus.PENDING_CHALLENGER && !isChallenger) {
        throw new ForbiddenException("Only challenger can submit first attempt");
      }

      if (request.status === RequestStatus.PENDING_RECIPIENT && !isTarget) {
        throw new ForbiddenException("Only recipient can submit handshake attempt");
      }

      await tx.challengeAttempt.create({
        data: { requestId: request.id, userId, passed, submittedCode }
      });

      if (!passed) {
        return tx.interestRequest.update({
          where: { id: request.id },
          data: { status: RequestStatus.FAILED },
          include: { challenge: true }
        });
      }

      if (request.status === RequestStatus.PENDING_CHALLENGER) {
        return tx.interestRequest.update({
          where: { id: request.id },
          data: {
            status: RequestStatus.PENDING_RECIPIENT,
            requestedAt: new Date()
          },
          include: { challenge: true }
        });
      }

      const finalized = await tx.interestRequest.update({
        where: { id: request.id },
        data: {
          status: RequestStatus.MATCHED,
          matchedAt: new Date()
        },
        include: { challenge: true }
      });

      await tx.match.create({
        data: {
          requestId: request.id,
          userAId: request.challengerId,
          userBId: request.targetId,
          room: { create: {} }
        }
      });

      return finalized;
    });
  }

  async cancelRequest(requestId: string, challengerId: string) {
    const request = await this.prisma.interestRequest.findUnique({ where: { id: requestId } });
    if (!request) {
      throw new NotFoundException("Request not found");
    }
    if (request.challengerId !== challengerId) {
      throw new ForbiddenException("Only challenger can cancel this request");
    }
    if (
      request.status === RequestStatus.MATCHED ||
      request.status === RequestStatus.FAILED ||
      request.status === RequestStatus.CANCELLED
    ) {
      throw new BadRequestException("Request already finalized");
    }

    return this.prisma.interestRequest.update({
      where: { id: requestId },
      data: { status: RequestStatus.CANCELLED }
    });
  }

  async getPendingForUser(userId: string) {
    return this.prisma.interestRequest.findMany({
      where: {
        targetId: userId,
        status: RequestStatus.PENDING_RECIPIENT
      },
      include: { challenge: true, challenger: true },
      orderBy: { createdAt: "desc" }
    });
  }

  async getMatchesForUser(userId: string) {
    return this.prisma.match.findMany({
      where: { OR: [{ userAId: userId }, { userBId: userId }] },
      include: {
        room: true,
        userA: { select: { id: true, name: true } },
        userB: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: "desc" }
    });
  }

  private async getRandomChallengeByDifficulty(difficulty: ChallengeDifficulty) {
    const total = await this.prisma.challenge.count({ where: { difficulty } });
    if (total === 0) {
      throw new NotFoundException(`No ${difficulty} challenge available`);
    }

    const skip = Math.floor(Math.random() * total);
    const challenge = await this.prisma.challenge.findFirst({
      where: { difficulty },
      skip
    });

    if (!challenge) {
      throw new NotFoundException("Challenge not found");
    }

    return challenge;
  }
}
