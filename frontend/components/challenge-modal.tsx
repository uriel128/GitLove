"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { Challenge } from "@/lib/types";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

type ChallengeModalProps = {
  challenge: Challenge;
  busy: boolean;
  onPass: (code: string) => Promise<void>;
  onFail: (code: string) => Promise<void>;
  onAbandon: () => Promise<void>;
  onClose: () => void;
};

export function ChallengeModal({
  challenge,
  busy,
  onPass,
  onFail,
  onAbandon,
  onClose
}: ChallengeModalProps) {
  const defaultCode = useMemo(
    () =>
      challenge.starterCode?.typescript ??
      "function solve(input: unknown): unknown {\n  return input;\n}",
    [challenge.starterCode]
  );

  const [code, setCode] = useState(defaultCode);
  const [submitted, setSubmitted] = useState(false);
  const [statusLog, setStatusLog] = useState<string | null>(null);

  async function submit(pass: boolean) {
    if (submitted || busy) {
      return;
    }
    setSubmitted(true);
    setStatusLog(pass ? "BUILD SUCCESSFUL" : "BUILD FAILED :: 403 FORBIDDEN");
    if (pass) {
      await onPass(code);
      return;
    }
    await onFail(code);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="flex h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-md border border-line bg-panel">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <div>
            <div className="text-sm text-muted">LeetCode Gate</div>
            <h2 className="text-base font-semibold">{challenge.title}</h2>
          </div>
          <div className="text-xs text-accent">{challenge.difficulty}</div>
        </div>

        <div className="grid flex-1 grid-cols-1 gap-0 overflow-hidden lg:grid-cols-[340px_1fr]">
          <section className="border-b border-line p-4 lg:border-b-0 lg:border-r">
            <p className="whitespace-pre-wrap text-sm leading-6 text-text/90">{challenge.description}</p>
            <div className="mt-4 rounded-md border border-line bg-black/20 p-3 text-xs text-muted">
              One attempt only. Success sends interest request. Failure closes the pipeline.
            </div>
            {statusLog ? (
              <div className="mt-3 rounded-md border border-line bg-black/20 px-3 py-2 font-mono text-xs text-ok">
                {statusLog}
              </div>
            ) : null}
          </section>

          <section className="flex min-h-0 flex-col">
            <div className="flex-1">
              <MonacoEditor
                height="100%"
                defaultLanguage="typescript"
                value={code}
                theme="vs-dark"
                onChange={(value) => setCode(value ?? "")}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  tabSize: 2,
                  scrollBeyondLastLine: false
                }}
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-3 py-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void submit(true)}
                  disabled={busy || submitted}
                  className="rounded-md border border-ok/60 bg-ok/10 px-3 py-1.5 text-sm text-ok disabled:opacity-50"
                >
                  Submit Pass (Demo)
                </button>
                <button
                  type="button"
                  onClick={() => void submit(false)}
                  disabled={busy || submitted}
                  className="rounded-md border border-bad/60 bg-bad/10 px-3 py-1.5 text-sm text-bad disabled:opacity-50"
                >
                  Submit Fail (Demo)
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void onAbandon()}
                  disabled={busy}
                  className="rounded-md border border-line px-3 py-1.5 text-sm text-muted hover:text-text disabled:opacity-50"
                >
                  Abandon
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-md border border-line px-3 py-1.5 text-sm text-muted hover:text-text"
                >
                  Close
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
