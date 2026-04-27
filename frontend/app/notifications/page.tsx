"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Bell, Check, CheckCheck, Clock3, X } from "lucide-react";
import { RequireAuth } from "@/components/require-auth";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { AppNotification, PendingInterestRequest } from "@/lib/types";

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const { currentUserId } = useAuth();

  const pendingQuery = useQuery({
    queryKey: ["pending-requests", currentUserId],
    queryFn: () => api.get<PendingInterestRequest[]>(`/interest/pending/${currentUserId}`),
    enabled: Boolean(currentUserId),
    refetchInterval: 15_000
  });

  const notificationsQuery = useQuery({
    queryKey: ["notifications", currentUserId],
    queryFn: () => api.get<AppNotification[]>(`/notifications/${currentUserId}`),
    enabled: Boolean(currentUserId),
    refetchInterval: 15_000
  });

  const respondMutation = useMutation({
    mutationFn: async (input: { requestId: string; decision: "ACCEPT" | "DECLINE" }) =>
      api.post(`/interest/${input.requestId}/respond`, {
        userId: currentUserId,
        decision: input.decision
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["pending-requests", currentUserId] }),
        queryClient.invalidateQueries({ queryKey: ["notifications", currentUserId] }),
        queryClient.invalidateQueries({ queryKey: ["matches", currentUserId] }),
        queryClient.invalidateQueries({ queryKey: ["build-log", currentUserId] })
      ]);
    }
  });

  const markReadMutation = useMutation({
    mutationFn: async (notificationId: string) =>
      api.post(`/notifications/${notificationId}/read`, { userId: currentUserId }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["notifications", currentUserId] });
    }
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => api.post("/notifications/read-all", { userId: currentUserId }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["notifications", currentUserId] });
    }
  });

  useEffect(() => {
    if (!currentUserId) {
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      return;
    }

    const channel = supabase
      .channel(`gitlove-notifications:${currentUserId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `recipient_id=eq.${currentUserId}`
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: ["notifications", currentUserId] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "interest_requests",
          filter: `target_id=eq.${currentUserId}`
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: ["pending-requests", currentUserId] });
          void queryClient.invalidateQueries({ queryKey: ["build-log", currentUserId] });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [currentUserId, queryClient]);

  const pendingRequests = pendingQuery.data ?? [];
  const notifications = notificationsQuery.data ?? [];
  const unreadCount = notifications.filter((item) => !item.readAt).length;

  return (
    <RequireAuth>
      <div className="space-y-5">
        <section className="flex items-center justify-between rounded-xl border border-line bg-gradient-to-r from-panel to-panelAlt px-5 py-4">
          <div>
            <h1 className="text-lg font-semibold text-text">Notifications</h1>
            <p className="mt-1 text-sm text-muted">
              Incoming requests and responses update here in realtime.
            </p>
          </div>
          <button
            type="button"
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending || unreadCount === 0}
            className="inline-flex items-center gap-2 rounded-full border border-line bg-panelAlt px-3 py-2 text-sm text-text disabled:opacity-50"
          >
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </button>
        </section>

        <section className="rounded-xl border border-line bg-gradient-to-r from-panel to-panelAlt px-5 py-4">
          <div className="mb-3 flex items-center gap-2">
            <Clock3 className="h-4 w-4 text-amber-400" />
            <h2 className="text-sm font-semibold text-text">Pending Requests</h2>
          </div>
          <div className="space-y-3">
            {pendingQuery.isLoading && pendingRequests.length === 0 ? (
              <p className="text-sm text-muted">Loading pending requests...</p>
            ) : pendingRequests.length === 0 ? (
              <p className="text-sm text-muted">No requests are waiting on you right now.</p>
            ) : (
              pendingRequests.map((request) => (
                <div key={request.id} className="rounded-xl border border-line bg-panelAlt px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-text">
                        {request.challenger?.name ?? "Developer"} wants to connect
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        Cleared {request.challenge.title} · {request.challenge.difficulty} ·{" "}
                        {new Date(request.requestedAt ?? request.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="rounded-full bg-panel px-2.5 py-1 text-[11px] font-medium text-muted">
                      Awaiting reply
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => respondMutation.mutate({ requestId: request.id, decision: "DECLINE" })}
                      disabled={respondMutation.isPending}
                      className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200 disabled:opacity-50"
                    >
                      <X className="h-4 w-4" />
                      Decline
                    </button>
                    <button
                      type="button"
                      onClick={() => respondMutation.mutate({ requestId: request.id, decision: "ACCEPT" })}
                      disabled={respondMutation.isPending}
                      className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
                    >
                      <Check className="h-4 w-4" />
                      Accept
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-xl border border-line bg-gradient-to-r from-panel to-panelAlt px-5 py-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-cyan-400" />
              <h2 className="text-sm font-semibold text-text">Activity Feed</h2>
            </div>
            <span className="rounded-full bg-panel px-2.5 py-1 text-[11px] font-medium text-muted">
              {unreadCount} unread
            </span>
          </div>
          <div className="space-y-3">
            {notificationsQuery.isLoading && notifications.length === 0 ? (
              <p className="text-sm text-muted">Loading notifications...</p>
            ) : notifications.length === 0 ? (
              <p className="text-sm text-muted">No notifications yet.</p>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`rounded-xl border px-4 py-3 ${
                    notification.readAt
                      ? "border-line bg-panelAlt"
                      : "border-cyan-400/30 bg-cyan-500/10"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-text">{notification.title}</p>
                      <p className="mt-1 text-sm text-muted">{notification.body}</p>
                      <p className="mt-2 text-xs text-muted">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {!notification.readAt ? (
                      <button
                        type="button"
                        onClick={() => markReadMutation.mutate(notification.id)}
                        disabled={markReadMutation.isPending}
                        className="inline-flex shrink-0 items-center gap-1 rounded-full border border-line bg-panel px-2.5 py-1 text-xs text-text disabled:opacity-50"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Read
                      </button>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </RequireAuth>
  );
}
