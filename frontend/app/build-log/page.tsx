"use client";

import { useQuery } from "@tanstack/react-query";
import { ReactNode } from "react";
import { CheckCircle2, Clock3, GitCommitHorizontal, Target, XCircle } from "lucide-react";
import { api } from "@/lib/api";
import { RequireAuth } from "@/components/require-auth";
import { useAuth } from "@/lib/auth";

type BuildLogResponse = {
  user: { id: string; name: string; email: string };
  systemHealth: {
    successRate: number;
    totalAttempts: number;
    passedAttempts: number;
    failedAttempts: number;
    matchCount: number;
  };
  globalSignals: {
    trendingLanguages: Array<{ language: string; count: number }>;
    challengePassRateByDifficulty: {
      EASY: number;
      MEDIUM: number;
      HARD: number;
    };
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
  const { currentUserId } = useAuth();

  const buildLogQuery = useQuery({
    queryKey: ["build-log", currentUserId],
    queryFn: () => api.get<BuildLogResponse>(`/build-log/${currentUserId}`),
    enabled: Boolean(currentUserId)
  });

  const data = buildLogQuery.data;

  return (
    <RequireAuth>
      <div className="space-y-5">
        {!data ? (
          <section className="rounded-xl border border-line bg-panel px-5 py-6 text-sm text-muted">
            Loading build metrics...
          </section>
        ) : (
          <>
            <section className="grid gap-3 md:grid-cols-4">
              <MetricTile icon={<Target className="h-4 w-4 text-sky-400" />} label="Attempts" value={data.systemHealth.totalAttempts} />
              <MetricTile icon={<CheckCircle2 className="h-4 w-4 text-emerald-400" />} label="Passed" value={data.systemHealth.passedAttempts} />
              <MetricTile icon={<GitCommitHorizontal className="h-4 w-4 text-purple-400" />} label="Commits" value={data.commits} />
              <MetricTile icon={<Clock3 className="h-4 w-4 text-amber-400" />} label="Matches" value={data.systemHealth.matchCount} />
            </section>

            <section className="rounded-xl border border-line bg-gradient-to-r from-panel to-panelAlt px-5 py-4">
              <h2 className="text-sm font-semibold text-text">System Health</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <ProgressRow label="Pass Rate" value={data.systemHealth.successRate} tone="good" />
                <ProgressRow
                  label="Failure Rate"
                  value={Math.max(0, 100 - data.systemHealth.successRate)}
                  tone="warn"
                />
              </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="rounded-xl border border-line bg-gradient-to-r from-panel to-panelAlt px-5 py-4">
                <h2 className="text-sm font-semibold text-text">Trending Languages</h2>
                <div className="mt-3 space-y-2">
                  {data.globalSignals.trendingLanguages.length === 0 ? (
                    <p className="text-sm text-muted">No merge signals yet.</p>
                  ) : (
                    data.globalSignals.trendingLanguages.map((language, index) => (
                      <div key={language.language} className="rounded-lg border border-line bg-panelAlt px-3 py-2.5">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-text">
                            {index + 1}. {language.language}
                          </span>
                          <span className="text-muted">{language.count}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-line bg-gradient-to-r from-panel to-panelAlt px-5 py-4">
                <h2 className="text-sm font-semibold text-text">Pass Rate by Difficulty</h2>
                <div className="mt-3 space-y-3">
                  <ProgressRow label="Easy" value={data.globalSignals.challengePassRateByDifficulty.EASY} tone="good" />
                  <ProgressRow label="Medium" value={data.globalSignals.challengePassRateByDifficulty.MEDIUM} tone="warn" />
                  <ProgressRow label="Hard" value={data.globalSignals.challengePassRateByDifficulty.HARD} tone="bad" />
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-line bg-gradient-to-r from-panel to-panelAlt px-5 py-4">
              <h2 className="text-sm font-semibold text-text">Pending Pull Requests</h2>
              <div className="mt-3 space-y-2">
                {data.pendingPullRequests.length === 0 ? (
                  <p className="text-sm text-muted">No pending requests.</p>
                ) : (
                  data.pendingPullRequests.map((request) => (
                    <div key={request.requestId} className="rounded-lg border border-line bg-panelAlt px-3 py-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium text-text">
                          {request.target.name} · {request.challenge.title}
                        </p>
                        <span className="rounded bg-panel px-2 py-0.5 text-[11px] font-medium text-muted">
                          {request.challenge.difficulty}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted">
                        Opened {new Date(request.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-xl border border-line bg-gradient-to-r from-panel to-panelAlt px-5 py-4">
              <h2 className="text-sm font-semibold text-text">Recent Attempts</h2>
              <div className="mt-3 space-y-2">
                {data.recentAttempts.length === 0 ? (
                  <p className="text-sm text-muted">No attempts logged yet.</p>
                ) : (
                  data.recentAttempts.map((attempt) => (
                    <div key={attempt.attemptId} className="rounded-lg border border-line bg-panelAlt px-3 py-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium text-text">{attempt.challenge.title}</p>
                        <span
                          className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium ${
                            attempt.passed ? "bg-emerald-500/15 text-emerald-300" : "bg-rose-500/15 text-rose-300"
                          }`}
                        >
                          {attempt.passed ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                          {attempt.passed ? "PASS" : "FAIL"}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted">
                        Target {attempt.targetName} · {new Date(attempt.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </RequireAuth>
  );
}

function MetricTile({
  icon,
  label,
  value
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border border-line bg-gradient-to-br from-panel to-panelAlt px-4 py-3">
      <div className="flex items-center justify-between text-xs text-muted">
        <span>{label}</span>
        {icon}
      </div>
      <div className="mt-1 text-xl font-semibold text-text">{value}</div>
    </div>
  );
}

function ProgressRow({
  label,
  value,
  tone
}: {
  label: string;
  value: number;
  tone: "good" | "warn" | "bad";
}) {
  const safeValue = Math.max(0, Math.min(100, Number(value.toFixed(2))));
  return (
    <div className="rounded-lg border border-line bg-panelAlt px-3 py-3">
      <div className="mb-2 flex items-center justify-between text-xs text-muted">
        <span>{label}</span>
        <span>{safeValue}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-panel">
        <div
          className={`h-2 rounded-full ${
            tone === "good" ? "bg-emerald-400" : tone === "warn" ? "bg-amber-400" : "bg-rose-400"
          }`}
          style={{ width: `${safeValue}%` }}
        />
      </div>
    </div>
  );
}
