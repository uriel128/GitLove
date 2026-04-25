"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { ChallengeModal } from "@/components/challenge-modal";
import { api } from "@/lib/api";
import { InterestRequest, User } from "@/lib/types";

export default function HomePage() {
  const queryClient = useQueryClient();
  const [viewerId, setViewerId] = useState("");
  const [cursor, setCursor] = useState(0);
  const [activeRequest, setActiveRequest] = useState<InterestRequest | null>(null);
  const [terminalLog, setTerminalLog] = useState("SYSTEM READY");

  const healthQuery = useQuery({
    queryKey: ["health"],
    queryFn: () => api.get<{ status: string; services: { db: string } }>("/health"),
    refetchInterval: 15_000
  });

  const usersQuery = useQuery({
    queryKey: ["users"],
    queryFn: () => api.get<User[]>("/users")
  });

  const users = usersQuery.data ?? [];
  const viewer = users.find((user) => user.id === viewerId) ?? null;
  const candidates = useMemo(() => users.filter((user) => user.id !== viewerId), [users, viewerId]);
  const candidate = candidates.length > 0 ? candidates[cursor % candidates.length] : null;

  useEffect(() => {
    if (!viewerId && users.length > 0) {
      setViewerId(users[0].id);
    }
  }, [users, viewerId]);

  useEffect(() => {
    setCursor(0);
  }, [viewerId]);

  const openMutation = useMutation({
    mutationFn: async (targetId: string) =>
      api.post<InterestRequest>("/interest/open", {
        challengerId: viewerId,
        targetId
      }),
    onSuccess: (request) => {
      setActiveRequest(request);
      setTerminalLog("CHALLENGE GATE OPENED");
    }
  });

  const attemptMutation = useMutation({
    mutationFn: async (input: { requestId: string; passed: boolean; submittedCode: string }) =>
      api.post<InterestRequest>(`/interest/${input.requestId}/attempt`, {
        userId: viewerId,
        passed: input.passed,
        submittedCode: input.submittedCode
      }),
    onSuccess: (request) => {
      const statusLog =
        request.status === "MATCHED" ? "BUILD SUCCESSFUL :: MERGE COMPLETE" : "BUILD SUCCESSFUL :: REQUEST SENT";
      setTerminalLog(statusLog);
      setActiveRequest(null);
      void queryClient.invalidateQueries({ queryKey: ["matches"] });
      void queryClient.invalidateQueries({ queryKey: ["build-log"] });
      void queryClient.invalidateQueries({ queryKey: ["stack-trace"] });
    },
    onError: (error) => {
      setTerminalLog(`BUILD FAILED :: ${error.message}`);
    }
  });

  const cancelMutation = useMutation({
    mutationFn: async (requestId: string) =>
      api.post(`/interest/${requestId}/cancel`, { challengerId: viewerId }),
    onSuccess: () => {
      setTerminalLog("CHALLENGE ABANDONED");
      setActiveRequest(null);
    }
  });

  function swipeLeft() {
    if (!candidate) {
      return;
    }
    setCursor((value) => value + 1);
    setTerminalLog("SWIPE LEFT :: SKIPPED");
  }

  function swipeRight() {
    if (!candidate) {
      return;
    }
    openMutation.mutate(candidate.id);
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 rounded-md border border-line bg-panel p-4 md:grid-cols-3">
        <div>
          <div className="text-xs text-muted">Backend Health</div>
          <div className="mt-1 text-sm">
            {healthQuery.data ? `${healthQuery.data.status.toUpperCase()}` : "Checking..."}
          </div>
        </div>
        <div>
          <div className="text-xs text-muted">Current User</div>
          <select
            value={viewerId}
            onChange={(event) => setViewerId(event.target.value)}
            className="mt-1 w-full rounded-md border border-line bg-panelAlt px-3 py-2 text-sm"
          >
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.email})
              </option>
            ))}
          </select>
        </div>
        <div>
          <div className="text-xs text-muted">Terminal Log</div>
          <div className="mt-1 rounded-md border border-line bg-black/30 px-3 py-2 font-mono text-xs text-ok">
            {terminalLog}
          </div>
        </div>
      </section>

      <section className="rounded-md border border-line bg-panel p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">Home / Production</h1>
          <div className="text-xs text-muted">
            {viewer?.profile?.challengeLevel ?? "EASY"} challenge level
          </div>
        </div>

        {!candidate ? (
          <div className="mt-4 text-sm text-muted">No candidate available yet.</div>
        ) : (
          <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_220px]">
            <div className="rounded-md border border-line bg-panelAlt p-4">
              <div className="text-xl font-semibold">{candidate.name}</div>
              <div className="mt-1 text-sm text-muted">{candidate.profile?.occupation ?? "Developer"}</div>
              <div className="mt-4 grid gap-2 text-sm md:grid-cols-2">
                <Field label="Age" value={candidate.profile?.age ?? "-"} />
                <Field label="Editor" value={candidate.profile?.editorChoice ?? "-"} />
                <Field label="Language" value={candidate.profile?.languageChoice ?? "-"} />
                <Field label="Framework" value={candidate.profile?.favoriteFramework ?? "-"} />
                <Field label="OS" value={candidate.profile?.favoriteOS ?? "-"} />
                <Field label="Data Structure" value={candidate.profile?.favoriteDataStructure ?? "-"} />
                <Field label="Algorithm" value={candidate.profile?.favoriteAlgorithm ?? "-"} />
                <Field
                  label="Hobbies"
                  value={candidate.profile?.hobbies?.length ? candidate.profile.hobbies.join(", ") : "-"}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={swipeLeft}
                className="rounded-md border border-line bg-panelAlt px-3 py-2 text-sm text-muted hover:text-text"
              >
                Swipe Left
              </button>
              <button
                type="button"
                onClick={swipeRight}
                disabled={openMutation.isPending || !viewerId}
                className="rounded-md border border-accent/60 bg-accent/10 px-3 py-2 text-sm text-accent disabled:opacity-50"
              >
                Swipe Right
              </button>
              <div className="mt-2 text-xs text-muted">
                Right swipe starts challenge with one attempt gate before interest request is sent.
              </div>
            </div>
          </div>
        )}
      </section>

      {activeRequest ? (
        <ChallengeModal
          challenge={activeRequest.challenge}
          busy={attemptMutation.isPending || cancelMutation.isPending}
          onPass={async (code) => {
            await attemptMutation.mutateAsync({
              requestId: activeRequest.id,
              passed: true,
              submittedCode: code
            });
          }}
          onFail={async (code) => {
            await attemptMutation.mutateAsync({
              requestId: activeRequest.id,
              passed: false,
              submittedCode: code
            });
            setTerminalLog("BUILD FAILED :: 403 FORBIDDEN");
            setActiveRequest(null);
          }}
          onAbandon={async () => {
            await cancelMutation.mutateAsync(activeRequest.id);
          }}
          onClose={() => setActiveRequest(null)}
        />
      ) : null}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-line bg-black/20 px-3 py-2">
      <div className="text-xs text-muted">{label}</div>
      <div className="text-sm">{value}</div>
    </div>
  );
}
