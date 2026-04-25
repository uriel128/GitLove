"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { RequireAuth } from "@/components/require-auth";
import { User } from "@/lib/types";

type BuildLogResponse = {
  user: { id: string; name: string; email: string };
  systemHealth: {
    successRate: number;
    totalAttempts: number;
    passedAttempts: number;
    failedAttempts: number;
    matchCount: number;
  };
  commits: number;
  pendingPullRequests: Array<{
    requestId: string;
    target: { id: string; name: string };
    challenge: { id: string; title: string; difficulty: string };
    requestedAt: string | null;
    createdAt: string;
  }>;
  recentAttempts: Array<{
    attemptId: string;
    requestId: string;
    passed: boolean;
    challenge: { id: string; title: string; difficulty: string };
    targetName: string;
    createdAt: string;
  }>;
};

export default function BuildLogPage() {
  const [userId, setUserId] = useState("");

  const usersQuery = useQuery({
    queryKey: ["users"],
    queryFn: () => api.get<User[]>("/users")
  });

  useEffect(() => {
    if (!userId && (usersQuery.data ?? []).length > 0) {
      setUserId(usersQuery.data![0].id);
    }
  }, [userId, usersQuery.data]);

  const buildLogQuery = useQuery({
    queryKey: ["build-log", userId],
    queryFn: () => api.get<BuildLogResponse>(`/build-log/${userId}`),
    enabled: Boolean(userId)
  });

  const data = buildLogQuery.data;

  return (
    <RequireAuth>
      <div className="space-y-4">
      <section className="rounded-md border border-line bg-panel p-4">
        <h1 className="text-lg font-semibold">Build Log / Personal Dashboard</h1>
        <div className="mt-3 max-w-sm">
          <label className="text-xs text-muted">User</label>
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
        </div>
      </section>

      {data ? (
        <>
          <section className="grid gap-3 md:grid-cols-5">
            <Metric label="Success Rate" value={`${data.systemHealth.successRate}%`} />
            <Metric label="Attempts" value={data.systemHealth.totalAttempts} />
            <Metric label="Passed" value={data.systemHealth.passedAttempts} />
            <Metric label="Commits" value={data.commits} />
            <Metric label="Matches" value={data.systemHealth.matchCount} />
          </section>

          <section className="rounded-md border border-line bg-panel p-4">
            <h2 className="text-sm font-semibold">Pending Pull Requests</h2>
            <div className="mt-2 space-y-2">
              {data.pendingPullRequests.length === 0 ? (
                <div className="text-sm text-muted">No pending handshake requests.</div>
              ) : (
                data.pendingPullRequests.map((request) => (
                  <div
                    key={request.requestId}
                    className="rounded-md border border-line bg-panelAlt px-3 py-2 text-sm"
                  >
                    <div className="font-medium">
                      {request.target.name} · {request.challenge.title}
                    </div>
                    <div className="text-xs text-muted">
                      {request.challenge.difficulty} · opened{" "}
                      {new Date(request.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-md border border-line bg-panel p-4">
            <h2 className="text-sm font-semibold">Recent Attempts</h2>
            <div className="mt-2 space-y-2">
              {data.recentAttempts.length === 0 ? (
                <div className="text-sm text-muted">No attempts logged yet.</div>
              ) : (
                data.recentAttempts.map((attempt) => (
                  <div
                    key={attempt.attemptId}
                    className="rounded-md border border-line bg-panelAlt px-3 py-2 text-sm"
                  >
                    <div className="font-medium">
                      {attempt.passed ? "PASS" : "FAIL"} · {attempt.challenge.title}
                    </div>
                    <div className="text-xs text-muted">
                      target: {attempt.targetName} · {new Date(attempt.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </>
      ) : (
        <section className="rounded-md border border-line bg-panel p-4 text-sm text-muted">
          Select a user to load dashboard data.
        </section>
      )}
      </div>
    </RequireAuth>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-line bg-panel p-3">
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
    </div>
  );
}
