"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RealtimeChannel } from "@supabase/supabase-js";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { MessageCircleMore, Search, Send } from "lucide-react";
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
  const [search, setSearch] = useState("");
  const [realtimeState, setRealtimeState] = useState("disconnected");
  const [demoStatus, setDemoStatus] = useState("");
  const [seedAttempted, setSeedAttempted] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  const matchesQuery = useQuery({
    queryKey: ["matches", currentUserId],
    queryFn: () => api.get<Match[]>(`/matches/${currentUserId}`),
    enabled: Boolean(currentUserId),
    staleTime: 20_000
  });

  const seedDemoMutation = useMutation({
    mutationFn: async () => {
      if (!currentUserId) {
        throw new Error("Missing current user");
      }
      return api.post<{ createdMatches: number; insertedMessages: number }>(
        "/chat/seed-demo/messages",
        { userId: currentUserId }
      );
    },
    onSuccess: async (result) => {
      setDemoStatus(
        `Demo DMs ready: ${result.createdMatches} chats created, ${result.insertedMessages} messages inserted.`
      );
      await queryClient.invalidateQueries({ queryKey: ["matches", currentUserId] });
    },
    onError: (error) => {
      setDemoStatus(error instanceof Error ? error.message : "Failed to seed demo chats");
    }
  });

  useEffect(() => {
    if (!currentUserId || seedAttempted || matchesQuery.isLoading) {
      return;
    }
    if ((matchesQuery.data ?? []).length === 0) {
      setSeedAttempted(true);
      setDemoStatus("Preparing demo DMs...");
      seedDemoMutation.mutate();
    }
  }, [currentUserId, matchesQuery.data, matchesQuery.isLoading, seedAttempted, seedDemoMutation]);

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
    queryFn: () => api.get<ChatMessage[]>(`/chat/${matchId}/messages?userId=${currentUserId}&limit=200`),
    enabled: Boolean(matchId && currentUserId),
    staleTime: 5_000
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

  useEffect(() => {
    const node = scrollerRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [messagesQuery.data, matchId]);

  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!currentUserId) {
        throw new Error("Missing current user");
      }

      const message = await api.post<ChatMessage>(`/chat/${matchId}/messages`, {
        senderId: currentUserId,
        content: content.trim(),
        format: "TEXT"
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
    }
  });

  const matches = matchesQuery.data ?? [];
  const filteredMatches = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) return matches;
    return matches.filter((match) =>
      `${match.userA.name} ${match.userB.name}`.toLowerCase().includes(normalized)
    );
  }, [matches, search]);

  const selectedMatch = useMemo(
    () => matches.find((match) => match.id === matchId) ?? null,
    [matches, matchId]
  );
  const selectedOtherUser = useMemo(() => {
    if (!selectedMatch || !currentUserId) {
      return null;
    }
    return selectedMatch.userA.id === currentUserId ? selectedMatch.userB : selectedMatch.userA;
  }, [currentUserId, selectedMatch]);

  return (
    <RequireAuth>
      <div className="h-[calc(100vh-185px)] min-h-[560px] overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-panel to-panelAlt shadow-2xl md:h-[calc(100vh-165px)]">
        <div className="grid h-full min-h-0 grid-cols-1 lg:grid-cols-[330px_1fr]">
          <aside className="flex min-h-0 flex-col border-b border-line bg-panel/90 lg:border-b-0 lg:border-r">
            <div className="p-4">
              <h1 className="text-lg font-semibold text-text">Direct Messages</h1>
              <p className="mt-1 text-xs text-muted">
                {realtimeState === "connected" ? "Realtime connected" : "Realtime disconnected"}
              </p>
              {demoStatus ? <p className="mt-1 text-xs text-muted">{demoStatus}</p> : null}
            </div>

            <div className="px-4 pb-4">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search DMs"
                  className="w-full rounded-xl border border-line bg-panelAlt py-2 pl-9 pr-3 text-sm text-text outline-none focus:border-accent"
                />
              </label>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
              {filteredMatches.length === 0 ? (
                <div className="m-2 rounded-xl border border-line bg-panelAlt p-4 text-sm text-muted">
                  No conversations yet.
                </div>
              ) : (
                filteredMatches.map((match) => {
                  const active = match.id === matchId;
                  const otherName =
                    match.userA.id === currentUserId ? match.userB.name : match.userA.name;

                  return (
                    <button
                      key={match.id}
                      type="button"
                      onClick={() => setMatchId(match.id)}
                      className={`m-2 flex w-[calc(100%-1rem)] items-center gap-3 rounded-xl border px-3 py-3 text-left transition ${
                        active
                          ? "border-accent/40 bg-accent/10"
                          : "border-line bg-panelAlt hover:border-accent/30 hover:bg-panel"
                      }`}
                    >
                      {(
                        match.userA.id === currentUserId ? match.userB.profileImage : match.userA.profileImage
                      ) ? (
                        <img
                          src={(match.userA.id === currentUserId ? match.userB.profileImage : match.userA.profileImage) || ""}
                          alt={otherName}
                          className="h-11 w-11 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500/30 to-fuchsia-500/30 text-sm font-semibold text-text">
                          {otherName.slice(0, 1).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-text">{otherName}</div>
                        <div className="truncate text-xs text-muted">
                          {active ? "Open conversation" : "Tap to open"}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          <section className="flex min-h-0 flex-col bg-panel/60">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <div className="flex items-center gap-3">
                {selectedOtherUser ? (
                  <Link href={`/users/${selectedOtherUser.id}`} className="flex items-center gap-3">
                    {selectedOtherUser.profileImage ? (
                      <img
                        src={selectedOtherUser.profileImage}
                        alt={selectedOtherUser.name}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500/30 to-fuchsia-500/30">
                        <MessageCircleMore className="h-5 w-5 text-text" />
                      </div>
                    )}
                    <div>
                      <h2 className="text-sm font-semibold text-text">{selectedOtherUser.name}</h2>
                      <p className="text-xs text-muted">Open profile</p>
                    </div>
                  </Link>
                ) : (
                  <>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500/30 to-fuchsia-500/30">
                      <MessageCircleMore className="h-5 w-5 text-text" />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-text">No active conversation</h2>
                      <p className="text-xs text-muted">Developer direct connection</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div ref={scrollerRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
              {(messagesQuery.data ?? []).length === 0 ? (
                <div className="mt-2 rounded-xl border border-line bg-panelAlt p-4 text-sm text-muted">
                  Start the conversation.
                </div>
              ) : (messagesQuery.data ?? []).map((message) => {
                const mine = message.senderId === currentUserId;
                return (
                  <div key={message.id} className={`mb-3 flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[72%] rounded-2xl px-3 py-2 ${
                        mine
                          ? "rounded-br-md bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white"
                          : "rounded-bl-md border border-line bg-panelAlt text-text"
                      }`}
                    >
                      <div className={`mb-1 text-[11px] ${mine ? "text-white/80" : "text-muted"}`}>
                        {message.sender.name} · {new Date(message.createdAt).toLocaleTimeString()}
                      </div>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-line p-4">
              <div className="flex items-center gap-2 rounded-xl border border-line bg-panelAlt p-2">
                <input
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey && matchId && content.trim() && !sendMutation.isPending) {
                      event.preventDefault();
                      sendMutation.mutate();
                    }
                  }}
                  placeholder="Send a message..."
                  className="w-full bg-transparent px-2 py-1 text-sm text-text outline-none"
                />
                <button
                  type="button"
                  disabled={!matchId || !content.trim() || sendMutation.isPending}
                  onClick={() => sendMutation.mutate()}
                  className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-cyan-500 to-fuchsia-500 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                  Send
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </RequireAuth>
  );
}
