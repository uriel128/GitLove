"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RealtimeChannel } from "@supabase/supabase-js";
import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/api";
import { RequireAuth } from "@/components/require-auth";
import { useAuth } from "@/lib/auth";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { ChatMessage, Match } from "@/lib/types";

export default function ChatPage() {
  const queryClient = useQueryClient();
  const { currentUserId } = useAuth();
  const [matchId, setMatchId] = useState("");
  const [content, setContent] = useState("");
  const [format, setFormat] = useState<"MARKDOWN" | "CODE" | "TEXT">("MARKDOWN");
  const [realtimeState, setRealtimeState] = useState("disconnected");
  const channelRef = useRef<RealtimeChannel | null>(null);

  const matchesQuery = useQuery({
    queryKey: ["matches", currentUserId],
    queryFn: () => api.get<Match[]>(`/matches/${currentUserId}`),
    enabled: Boolean(currentUserId)
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
    queryKey: ["messages", matchId, currentUserId],
    queryFn: () => api.get<ChatMessage[]>(`/chat/${matchId}/messages?userId=${currentUserId}&limit=80`),
    enabled: Boolean(matchId && currentUserId)
  });

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    if (!supabase || !matchId || !currentUserId) {
      setRealtimeState("disconnected");
      return;
    }

    const channel = supabase
      .channel(`chat:${matchId}`)
      .on("broadcast", { event: "new_message" }, () => {
        void queryClient.invalidateQueries({ queryKey: ["messages", matchId, currentUserId] });
        void queryClient.invalidateQueries({ queryKey: ["stack-trace"] });
      })
      .subscribe((status) => {
        setRealtimeState(status === "SUBSCRIBED" ? "connected" : "disconnected");
      });

    channelRef.current = channel;

    return () => {
      channelRef.current = null;
      void supabase.removeChannel(channel);
      setRealtimeState("disconnected");
    };
  }, [currentUserId, matchId, queryClient]);

  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!currentUserId) {
        throw new Error("Missing current user");
      }

      const message = await api.post<ChatMessage>(`/chat/${matchId}/messages`, {
        senderId: currentUserId,
        content: content.trim(),
        format
      });

      const channel = channelRef.current;
      if (channel) {
        await channel.send({
          type: "broadcast",
          event: "new_message",
          payload: { matchId }
        });
      }

      return message;
    },
    onSuccess: () => {
      setContent("");
      void queryClient.invalidateQueries({ queryKey: ["messages", matchId, currentUserId] });
      void queryClient.invalidateQueries({ queryKey: ["stack-trace"] });
    }
  });

  const selectedMatch = useMemo(
    () => (matchesQuery.data ?? []).find((match) => match.id === matchId) ?? null,
    [matchesQuery.data, matchId]
  );

  return (
    <RequireAuth>
      <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
        <section className="rounded-md border border-line bg-panel p-4">
          <h1 className="text-base font-semibold">Chat / Direct Connection</h1>
          <div className="mt-1 text-xs text-muted">Realtime status: {realtimeState}</div>

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
              disabled={!matchId || !content.trim() || sendMutation.isPending || realtimeState !== "connected"}
              onClick={() => sendMutation.mutate()}
              className="rounded-md border border-accent/60 bg-accent/10 px-4 py-2 text-sm text-accent disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </section>
      </div>
    </RequireAuth>
  );
}
