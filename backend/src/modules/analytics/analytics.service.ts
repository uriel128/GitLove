import { Injectable, NotFoundException } from "@nestjs/common";
import { ChallengeDifficulty, RequestStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getBuildLog(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true }
    });
    if (!user) {
      throw new NotFoundException("User not found");
    }

    const [attempts, commitCount, pendingPullRequests, matchCount] = await Promise.all([
      this.prisma.challengeAttempt.findMany({
        where: { userId },
        include: { request: { include: { challenge: true, target: { select: { name: true } } } } },
        orderBy: { createdAt: "desc" }
      }),
      this.prisma.interestRequest.count({ where: { challengerId: userId } }),
      this.prisma.interestRequest.findMany({
        where: {
          challengerId: userId,
          status: RequestStatus.PENDING_RECIPIENT
        },
        include: {
          target: { select: { id: true, name: true } },
          challenge: { select: { id: true, title: true, difficulty: true } }
        },
        orderBy: { createdAt: "desc" }
      }),
      this.prisma.match.count({
        where: {
          OR: [{ userAId: userId }, { userBId: userId }]
        }
      })
    ]);

    const passedAttempts = attempts.filter((attempt) => attempt.passed).length;
    const failedAttempts = attempts.length - passedAttempts;
    const successRate = attempts.length > 0 ? (passedAttempts / attempts.length) * 100 : 0;

    return {
      user,
      systemHealth: {
        successRate: Number(successRate.toFixed(2)),
        totalAttempts: attempts.length,
        passedAttempts,
        failedAttempts,
        matchCount
      },
      commits: commitCount,
      pendingPullRequests: pendingPullRequests.map((request) => ({
        requestId: request.id,
        target: request.target,
        challenge: request.challenge,
        requestedAt: request.requestedAt,
        createdAt: request.createdAt
      })),
      recentAttempts: attempts.slice(0, 10).map((attempt) => ({
        attemptId: attempt.id,
        requestId: attempt.requestId,
        passed: attempt.passed,
        challenge: {
          id: attempt.request.challenge.id,
          title: attempt.request.challenge.title,
          difficulty: attempt.request.challenge.difficulty
        },
        targetName: attempt.request.target.name,
        createdAt: attempt.createdAt
      }))
    };
  }

  async getStackTrace() {
    const [users, matches, requests, messages, recentMerges, attempts] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.match.count(),
      this.prisma.interestRequest.count(),
      this.prisma.chatMessage.count(),
      this.prisma.match.findMany({
        orderBy: { createdAt: "desc" },
        take: 12,
        include: {
          userA: { select: { id: true, name: true, profile: { select: { languageChoice: true } } } },
          userB: { select: { id: true, name: true, profile: { select: { languageChoice: true } } } }
        }
      }),
      this.prisma.challengeAttempt.findMany({
        include: {
          request: {
            select: {
              challenge: {
                select: { difficulty: true }
              }
            }
          }
        }
      })
    ]);

    const languageCounter = new Map<string, number>();
    for (const merge of recentMerges) {
      for (const language of [merge.userA.profile?.languageChoice, merge.userB.profile?.languageChoice]) {
        if (!language) {
          continue;
        }
        languageCounter.set(language, (languageCounter.get(language) ?? 0) + 1);
      }
    }

    const trendingLanguages = [...languageCounter.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([language, count]) => ({ language, count }));

    const byDifficulty: Record<ChallengeDifficulty, { attempts: number; passed: number }> = {
      EASY: { attempts: 0, passed: 0 },
      MEDIUM: { attempts: 0, passed: 0 },
      HARD: { attempts: 0, passed: 0 }
    };

    for (const attempt of attempts) {
      const difficulty = attempt.request.challenge.difficulty;
      byDifficulty[difficulty].attempts += 1;
      if (attempt.passed) {
        byDifficulty[difficulty].passed += 1;
      }
    }

    return {
      totals: { users, matches, requests, messages },
      trendingLanguages,
      liveMerges: recentMerges.map((merge) => ({
        matchId: merge.id,
        createdAt: merge.createdAt,
        users: [
          { id: merge.userA.id, name: merge.userA.name },
          { id: merge.userB.id, name: merge.userB.name }
        ]
      })),
      challengePassRateByDifficulty: {
        EASY: toRate(byDifficulty.EASY.passed, byDifficulty.EASY.attempts),
        MEDIUM: toRate(byDifficulty.MEDIUM.passed, byDifficulty.MEDIUM.attempts),
        HARD: toRate(byDifficulty.HARD.passed, byDifficulty.HARD.attempts)
      }
    };
  }
}

function toRate(passed: number, total: number) {
  if (total === 0) {
    return 0;
  }
  return Number(((passed / total) * 100).toFixed(2));
}
