"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { api } from "@/lib/api";
import { ChatMessage, Match, User } from "@/lib/types";

const socketBase = process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:4000";
const chatNamespace = process.env.NEXT_PUBLIC_CHAT_NAMESPACE ?? "/chat";

export default function ChatPage() {
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState("");
  const [matchId, setMatchId] = useState("");
  const [content, setContent] = useState("");
  const [format, setFormat] = useState<"MARKDOWN" | "CODE" | "TEXT">("MARKDOWN");
  const [socketState, setSocketState] = useState("disconnected");
  const socketRef = useRef<Socket | null>(null);

  const usersQuery = useQuery({
    queryKey: ["users"],
    queryFn: () => api.get<User[]>("/users")
  });

  useEffect(() => {
    const users = usersQuery.data ?? [];
    if (!userId && users.length > 0) {
      setUserId(users[0].id);
    }
  }, [usersQuery.data, userId]);

  const matchesQuery = useQuery({
    queryKey: ["matches", userId],
    queryFn: () => api.get<Match[]>(`/matches/${userId}`),
    enabled: Boolean(userId)
  });

  useEffect(() => {
    const matches = matchesQuery.data ?? [];
    if (matches.length === 0) {
      setMatchId("");
      return;
    }
    if (!matches.some((match) => match.id === matchId)) {
      setMatchId(matches[0].id);
    }
  }, [matchesQuery.data, matchId]);

  const messagesQuery = useQuery({
    queryKey: ["messages", matchId, userId],
    queryFn: () => api.get<ChatMessage[]>(`/chat/${matchId}/messages?userId=${userId}&limit=80`),
    enabled: Boolean(matchId && userId)
  });

  useEffect(() => {
    if (!userId || !matchId) {
      return;
    }

    const socket: Socket = io(`${socketBase}${chatNamespace}`, {
      auth: { userId }
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setSocketState("connected");
      socket.emit("join_room", { matchId });
    });
    socket.on("disconnect", () => setSocketState("disconnected"));
    socket.on("new_message", () => {
      void queryClient.invalidateQueries({ queryKey: ["messages", matchId, userId] });
      void queryClient.invalidateQueries({ queryKey: ["stack-trace"] });
    });

    return () => {
      socketRef.current = null;
      socket.disconnect();
    };
  }, [userId, matchId, queryClient]);

  const sendMutation = useMutation({
    mutationFn: async () => {
      const socket = socketRef.current;
      if (!socket || socketState !== "connected") {
        throw new Error("socket not connected");
      }

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error("send timeout")), 3000);
        socket.emit(
          "send_message",
          {
            matchId,
            content: content.trim(),
            format
          },
          (ack: { ok?: boolean }) => {
            clearTimeout(timeout);
            if (ack?.ok) {
              resolve();
              return;
            }
            reject(new Error("message rejected"));
          }
        );
      });
    },
    onSuccess: () => {
      setContent("");
    }
  });

  const selectedMatch = useMemo(
    () => (matchesQuery.data ?? []).find((match) => match.id === matchId) ?? null,
    [matchesQuery.data, matchId]
  );

  return (
    <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
      <section className="rounded-md border border-line bg-panel p-4">
        <h1 className="text-base font-semibold">Chat / Direct Connection</h1>
        <div className="mt-1 text-xs text-muted">Socket status: {socketState}</div>

        <label className="mt-4 block text-xs text-muted">Active User</label>
        <select
          value={userId}
          onChange={(event) => setUserId(event.target.value)}
          className="mt-1 w-full rounded-md border border-line bg-panelAlt px-3 py-2 text-sm"
        >
          {(usersQuery.data ?? []).map((user) => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </select>

        <label className="mt-4 block text-xs text-muted">Match</label>
        <select
          value={matchId}
          onChange={(event) => setMatchId(event.target.value)}
          className="mt-1 w-full rounded-md border border-line bg-panelAlt px-3 py-2 text-sm"
        >
          {(matchesQuery.data ?? []).map((match) => (
            <option key={match.id} value={match.id}>
              {match.userA.name} ↔ {match.userB.name}
            </option>
          ))}
        </select>
      </section>

      <section className="rounded-md border border-line bg-panel p-4">
        <div className="border-b border-line pb-3">
          <h2 className="text-sm text-muted">
            {selectedMatch ? `${selectedMatch.userA.name} and ${selectedMatch.userB.name}` : "No active match"}
          </h2>
        </div>

        <div className="mt-3 h-[48vh] space-y-2 overflow-y-auto rounded-md border border-line bg-panelAlt p-3">
          {(messagesQuery.data ?? []).map((message) => (
            <div key={message.id} className="rounded-md border border-line bg-black/20 px-3 py-2">
              <div className="text-xs text-muted">
                {message.sender.name} · {new Date(message.createdAt).toLocaleTimeString()}
              </div>
              {message.format === "CODE" ? (
                <pre className="mt-1 overflow-x-auto text-xs text-accent">{message.content}</pre>
              ) : (
                <p className="mt-1 whitespace-pre-wrap text-sm">{message.content}</p>
              )}
            </div>
          ))}
        </div>

        <div className="mt-3 flex gap-2">
          <select
            value={format}
            onChange={(event) => setFormat(event.target.value as "MARKDOWN" | "CODE" | "TEXT")}
            className="rounded-md border border-line bg-panelAlt px-2 py-2 text-sm"
          >
            <option value="MARKDOWN">Markdown</option>
            <option value="CODE">Code</option>
            <option value="TEXT">Text</option>
          </select>
          <input
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Write a message or code snippet"
            className="w-full rounded-md border border-line bg-panelAlt px-3 py-2 text-sm"
          />
          <button
            type="button"
            disabled={!matchId || !content.trim() || sendMutation.isPending || socketState !== "connected"}
            onClick={() => sendMutation.mutate()}
            className="rounded-md border border-accent/60 bg-accent/10 px-4 py-2 text-sm text-accent disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </section>
    </div>
  );
}
