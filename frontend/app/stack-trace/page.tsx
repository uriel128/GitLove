"use client";

import { useQuery } from "@tanstack/react-query";
import { Flame } from "lucide-react";
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
        {!data ? (
          <section className="rounded-xl border border-line bg-panel px-5 py-6 text-sm text-muted">
            Loading global metrics...
          </section>
        ) : (
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
        )}
      </div>
    </RequireAuth>
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
