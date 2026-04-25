"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

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
    <div className="space-y-4">
      <section className="rounded-md border border-line bg-panel p-4">
        <h1 className="text-lg font-semibold">Stack Trace / Global Trends</h1>
        <div className="mt-1 text-xs text-muted">Live refresh every 10 seconds</div>
      </section>

      {data ? (
        <>
          <section className="grid gap-3 md:grid-cols-4">
            <Metric label="Users" value={data.totals.users} />
            <Metric label="Requests" value={data.totals.requests} />
            <Metric label="Matches" value={data.totals.matches} />
            <Metric label="Messages" value={data.totals.messages} />
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <div className="rounded-md border border-line bg-panel p-4">
              <h2 className="text-sm font-semibold">Trending Languages</h2>
              <div className="mt-2 space-y-2">
                {data.trendingLanguages.length === 0 ? (
                  <div className="text-sm text-muted">No merge data yet.</div>
                ) : (
                  data.trendingLanguages.map((language) => (
                    <div
                      key={language.language}
                      className="flex items-center justify-between rounded-md border border-line bg-panelAlt px-3 py-2 text-sm"
                    >
                      <span>{language.language}</span>
                      <span className="text-muted">{language.count}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-md border border-line bg-panel p-4">
              <h2 className="text-sm font-semibold">Pass Rate by Difficulty</h2>
              <div className="mt-2 space-y-2">
                <PassRateRow label="Easy" value={data.challengePassRateByDifficulty.EASY} />
                <PassRateRow label="Medium" value={data.challengePassRateByDifficulty.MEDIUM} />
                <PassRateRow label="Hard" value={data.challengePassRateByDifficulty.HARD} />
              </div>
            </div>
          </section>

          <section className="rounded-md border border-line bg-panel p-4">
            <h2 className="text-sm font-semibold">Live Merge Ticker</h2>
            <div className="mt-2 space-y-2">
              {data.liveMerges.length === 0 ? (
                <div className="text-sm text-muted">No successful merges yet.</div>
              ) : (
                data.liveMerges.map((merge) => (
                  <div
                    key={merge.matchId}
                    className="rounded-md border border-line bg-panelAlt px-3 py-2 text-sm"
                  >
                    <div className="font-medium">
                      {merge.users.map((user) => user.name).join(" ↔ ")}
                    </div>
                    <div className="text-xs text-muted">{new Date(merge.createdAt).toLocaleString()}</div>
                  </div>
                ))
              )}
            </div>
          </section>
        </>
      ) : (
        <section className="rounded-md border border-line bg-panel p-4 text-sm text-muted">
          Waiting for stack trace metrics...
        </section>
      )}
    </div>
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

function PassRateRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-line bg-panelAlt px-3 py-2 text-sm">
      <div className="flex items-center justify-between">
        <span>{label}</span>
        <span className="text-muted">{value}%</span>
      </div>
    </div>
  );
}
