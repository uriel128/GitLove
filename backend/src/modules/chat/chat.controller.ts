import { BadRequestException, Controller, Get, Param, Query } from "@nestjs/common";
import { ChatService } from "./chat.service";

@Controller("chat")
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get(":matchId/messages")
  async listMessages(
    @Param("matchId") matchId: string,
    @Query("userId") userId?: string,
    @Query("limit") limit?: string
  ) {
    if (!userId) {
      throw new BadRequestException("userId query param is required");
    }

    const parsedLimit = limit ? Number(limit) : 50;
    return this.chatService.getMessages(matchId, userId, parsedLimit);
  }
}
