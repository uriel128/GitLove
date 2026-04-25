import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { MessageFormat } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  async ensureMatchMembership(matchId: string, userId: string) {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: { room: true }
    });

    if (!match) {
      throw new NotFoundException("Match not found");
    }

    if (match.userAId !== userId && match.userBId !== userId) {
      throw new ForbiddenException("You are not part of this match");
    }

    if (match.room) {
      return match;
    }

    const room = await this.prisma.chatRoom.create({
      data: { matchId: match.id }
    });

    return { ...match, room };
  }

  async createMessage(matchId: string, senderId: string, content: string, format: MessageFormat) {
    const matchWithRoom = await this.ensureMatchMembership(matchId, senderId);
    if (!matchWithRoom.room) {
      throw new NotFoundException("Chat room unavailable");
    }

    return this.prisma.chatMessage.create({
      data: {
        roomId: matchWithRoom.room.id,
        senderId,
        content,
        format
      },
      include: {
        sender: {
          select: { id: true, name: true }
        }
      }
    });
  }

  async getMessages(matchId: string, userId: string, limit = 50) {
    const matchWithRoom = await this.ensureMatchMembership(matchId, userId);
    if (!matchWithRoom.room) {
      return [];
    }

    return this.prisma.chatMessage.findMany({
      where: { roomId: matchWithRoom.room.id },
      orderBy: { createdAt: "asc" },
      take: Math.max(1, Math.min(limit, 100)),
      include: {
        sender: { select: { id: true, name: true } }
      }
    });
  }
}
