"use client";

import { useQuery } from "@tanstack/react-query";
import { ReactNode } from "react";
import { Activity, Flame, GitMerge, MessageSquareText, Users } from "lucide-react";
import { api } from "@/lib/api";
import { RequireAuth } from "@/components/require-auth";

type StackTraceResponse = {
  totals: {
    users: number;
    matches: number;
    requests: number;
    messages: number;
  };
  trendingLanguages: Array<{ language: string; count: number }>;
  liveMerges: Array<{
    matchId: string;
    createdAt: string;
    users: Array<{ id: string; name: string }>;
  }>;
  challengePassRateByDifficulty: {
    EASY: number;
    MEDIUM: number;
    HARD: number;
  };
};

export default function StackTracePage() {
  const stackQuery = useQuery({
    queryKey: ["stack-trace"],
    queryFn: () => api.get<StackTraceResponse>("/stack-trace"),
    refetchInterval: 10_000
  });

  const data = stackQuery.data;

  return (
    <RequireAuth>
      <div className="space-y-5">
        <section className="rounded-xl border border-line bg-gradient-to-r from-panel via-panelAlt/70 to-panel px-5 py-4">
          <h1 className="text-lg font-semibold text-text">Stack Trace</h1>
          <p className="mt-1 text-sm text-muted">Global platform metrics · auto refresh every 10 seconds</p>
        </section>

        {!data ? (
          <section className="rounded-xl border border-line bg-panel px-5 py-6 text-sm text-muted">
            Loading global metrics...
          </section>
        ) : (
          <>
            <section className="grid gap-3 md:grid-cols-4">
              <MetricTile icon={<Users className="h-4 w-4 text-sky-400" />} label="Users" value={data.totals.users} />
              <MetricTile icon={<Activity className="h-4 w-4 text-purple-400" />} label="Requests" value={data.totals.requests} />
              <MetricTile icon={<GitMerge className="h-4 w-4 text-emerald-400" />} label="Matches" value={data.totals.matches} />
              <MetricTile icon={<MessageSquareText className="h-4 w-4 text-amber-400" />} label="Messages" value={data.totals.messages} />
            </section>

            <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="rounded-xl border border-line bg-gradient-to-r from-panel to-panelAlt px-5 py-4">
                <div className="mb-3 flex items-center gap-2">
                  <Flame className="h-4 w-4 text-accent" />
                  <h2 className="text-sm font-semibold text-text">Trending Languages</h2>
                </div>
                <div className="space-y-2">
                  {data.trendingLanguages.length === 0 ? (
                    <p className="text-sm text-muted">No merge signals yet.</p>
                  ) : (
                    data.trendingLanguages.map((language, index) => (
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
                  <ProgressRow label="Easy" value={data.challengePassRateByDifficulty.EASY} color="bg-emerald-400" />
                  <ProgressRow label="Medium" value={data.challengePassRateByDifficulty.MEDIUM} color="bg-amber-400" />
                  <ProgressRow label="Hard" value={data.challengePassRateByDifficulty.HARD} color="bg-rose-400" />
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-line bg-gradient-to-r from-panel to-panelAlt px-5 py-4">
              <h2 className="text-sm font-semibold text-text">Live Merge Ticker</h2>
              <div className="mt-3 space-y-2">
                {data.liveMerges.length === 0 ? (
                  <p className="text-sm text-muted">No successful merges yet.</p>
                ) : (
                  data.liveMerges.map((merge) => (
                    <div key={merge.matchId} className="rounded-lg border border-line bg-panelAlt px-3 py-2.5">
                      <p className="text-sm font-medium text-text">
                        {merge.users.map((user) => user.name).join(" ↔ ")}
                      </p>
                      <p className="mt-1 text-xs text-muted">{new Date(merge.createdAt).toLocaleString()}</p>
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
  color
}: {
  label: string;
  value: number;
  color: string;
}) {
  const safeValue = Math.max(0, Math.min(100, Number(value.toFixed(2))));
  return (
    <div className="rounded-lg border border-line bg-panelAlt px-3 py-3">
      <div className="mb-2 flex items-center justify-between text-xs text-muted">
        <span>{label}</span>
        <span>{safeValue}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-panel">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${safeValue}%` }} />
      </div>
    </div>
  );
}
