import { Logger } from "@nestjs/common";
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException
} from "@nestjs/websockets";
import { MessageFormat } from "@prisma/client";
import { Server, Socket } from "socket.io";
import { env } from "../../config/env";
import { ChatService } from "./chat.service";

type JoinRoomPayload = {
  matchId: string;
};

type SendMessagePayload = {
  matchId: string;
  content: string;
  format?: MessageFormat;
};

@WebSocketGateway({
  namespace: env.CHAT_NAMESPACE,
  cors: {
    origin: env.CORS_ORIGIN,
    credentials: true
  }
})
export class ChatGateway implements OnGatewayConnection {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(ChatGateway.name);

  constructor(private readonly chatService: ChatService) {}

  handleConnection(client: Socket) {
    const rawUserId = client.handshake.auth.userId ?? client.handshake.query.userId;
    const userId = typeof rawUserId === "string" ? rawUserId : null;
    if (!userId) {
      client.emit("error_event", { message: "userId is required in socket auth/query" });
      client.disconnect(true);
      return;
    }

    client.data.userId = userId;
    this.logger.log(`Socket connected: ${client.id} user=${userId}`);
  }

  @SubscribeMessage("join_room")
  async joinRoom(@ConnectedSocket() client: Socket, @MessageBody() payload: JoinRoomPayload) {
    if (!payload?.matchId) {
      throw new WsException("matchId is required");
    }

    const userId = client.data.userId as string;
    const match = await this.chatService.ensureMatchMembership(payload.matchId, userId);
    if (!match.room) {
      throw new WsException("Room unavailable");
    }

    client.join(match.room.id);
    return { ok: true, roomId: match.room.id };
  }

  @SubscribeMessage("send_message")
  async sendMessage(@ConnectedSocket() client: Socket, @MessageBody() payload: SendMessagePayload) {
    if (!payload?.matchId || !payload?.content) {
      throw new WsException("matchId and content are required");
    }

    const userId = client.data.userId as string;
    const message = await this.chatService.createMessage(
      payload.matchId,
      userId,
      payload.content,
      payload.format ?? MessageFormat.MARKDOWN
    );

    const match = await this.chatService.ensureMatchMembership(payload.matchId, userId);
    if (!match.room) {
      throw new WsException("Room unavailable");
    }

    this.server.to(match.room.id).emit("new_message", message);
    return { ok: true, messageId: message.id };
  }
}
