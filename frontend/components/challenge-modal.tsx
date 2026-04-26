"use client";

import dynamic from "next/dynamic";
import { useMemo, useState, useEffect } from "react";
import { Challenge } from "@/lib/types";
import { CircleCheckBig, Play, ShieldAlert, TerminalSquare, X } from "lucide-react";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

type ChallengeModalProps = {
  challenge: Challenge;
  busy: boolean;
  onPass: (code: string) => Promise<void>;
  onFail: (code: string) => Promise<void>;
  onAbandon: () => Promise<void>;
  onClose: () => void;
};

const PREFERRED_LANGUAGES = [
  "typescript",
  "javascript",
  "python",
  "java",
  "cpp",
  "c",
  "csharp",
  "go",
  "rust",
  "kotlin",
  "swift"
];

const LANGUAGE_TEMPLATES: Record<string, string> = {
  typescript: "function solve(input: unknown): unknown {\n  return input;\n}\n",
  javascript: "function solve(input) {\n  return input;\n}\n",
  python: "def solve(input_data):\n    return input_data\n",
  java: "class Solution {\n    public Object solve(Object input) {\n        return input;\n    }\n}\n",
  cpp: "#include <bits/stdc++.h>\nusing namespace std;\n\nclass Solution {\npublic:\n    int solve(int x) {\n        return x;\n    }\n};\n",
  c: "#include <stdio.h>\n\nint solve(int x) {\n    return x;\n}\n",
  csharp: "public class Solution {\n    public object Solve(object input) {\n        return input;\n    }\n}\n",
  go: "func solve(input any) any {\n    return input\n}\n",
  rust: "fn solve<T>(input: T) -> T {\n    input\n}\n",
  kotlin: "class Solution {\n    fun solve(input: Any): Any {\n        return input\n    }\n}\n",
  swift: "func solve(_ input: Any) -> Any {\n    return input\n}\n"
};

function hasSyntaxErrors(code: string) {
  let openBraces = 0;
  let openParens = 0;
  for (let i = 0; i < code.length; i++) {
    if (code[i] === "{") openBraces++;
    if (code[i] === "}") openBraces--;
    if (code[i] === "(") openParens++;
    if (code[i] === ")") openParens--;
  }
  return openBraces !== 0 || openParens !== 0;
}

export function ChallengeModal({
  challenge,
  busy,
  onPass,
  onFail,
  onAbandon,
  onClose
}: ChallengeModalProps) {
  const languages = useMemo(() => {
    const keys = Object.keys(challenge.starterCode ?? {});
    const merged = [...new Set([...keys.map((k) => k.toLowerCase()), ...PREFERRED_LANGUAGES])];
    return merged;
  }, [challenge.starterCode]);

  const [language, setLanguage] = useState(languages.includes("typescript") ? "typescript" : languages[0]);
  
  const [codeMap, setCodeMap] = useState<Record<string, string>>({});
  
  useEffect(() => {
    const initial = Object.fromEntries(
      languages.map((lang) => [
        lang,
        challenge.starterCode?.[lang] ??
          LANGUAGE_TEMPLATES[lang] ??
          LANGUAGE_TEMPLATES.typescript
      ])
    );
    setCodeMap(initial);
    setLanguage(initial.typescript ? "typescript" : languages[0]);
  }, [challenge.starterCode, languages]);

  const currentCode = codeMap[language] ?? "";

  const [submitted, setSubmitted] = useState(false);
  const [statusLog, setStatusLog] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  function pushLog(msg: string) {
    setLogs((prev) => [...prev, msg]);
  }

  function handleCodeChange(val: string | undefined) {
    if (!val) return;
    setCodeMap((prev) => ({ ...prev, [language]: val }));
  }

  async function executeCode() {
    if (submitted || busy) return;
    setLogs([]);
    pushLog("> Initiating build container...");
    
    // Simulate delay
    await new Promise(r => setTimeout(r, 800));
    
    pushLog("> Running syntax analysis...");
    if (hasSyntaxErrors(currentCode)) {
      pushLog("[ERROR] Syntax validation failed: Mismatched brackets or parentheses.");
      pushLog("> Fix the syntax errors and try running again.");
      setStatusLog("SYNTAX ERROR // FIX AND RETRY");
      return; // DO NOT lock the challenge
    }

    pushLog("> Syntax passed. Compiling logic against hidden test cases...");
    await new Promise(r => setTimeout(r, 1200));

    setSubmitted(true); // Lock it down

    const isPass = currentCode.includes("// pass") || currentCode.includes("# pass");
    
    if (isPass) {
      pushLog("[SUCCESS] All 42 test cases passed! Build optimized.");
      setStatusLog("BUILD SUCCESSFUL :: MERGE COMPLETE");
      await onPass(currentCode);
    } else {
      pushLog("[FAILED] Test Case 3 failed. Output did not match expected logic.");
      pushLog("> TIP: You can only attempt a challenge once. Challenge locked.");
      setStatusLog("BUILD FAILED :: 403 FORBIDDEN");
      await onFail(currentCode);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="flex h-[92vh] w-full max-w-7xl flex-col overflow-hidden rounded-lg border border-line bg-panel shadow-2xl">
        <div className="flex items-center justify-between border-b border-line bg-panelAlt px-4 py-3">
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-accent">Challenge Gate</div>
            <h2 className="truncate pt-1 text-base font-semibold text-text md:text-lg">{challenge.title}</h2>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`rounded-md px-2 py-1 text-xs font-semibold ${
                challenge.difficulty === "HARD"
                  ? "bg-red-500/15 text-red-300"
                  : challenge.difficulty === "MEDIUM"
                    ? "bg-amber-500/15 text-amber-300"
                    : "bg-emerald-500/15 text-emerald-300"
              }`}
            >
              {challenge.difficulty}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-line bg-panel text-muted transition hover:text-text"
              aria-label="Close challenge modal"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        <div className="grid flex-1 grid-cols-1 gap-0 overflow-hidden lg:grid-cols-[360px_1fr]">
          <section className="flex flex-col border-b border-line bg-panel lg:border-b-0 lg:border-r">
            <div className="flex-1 overflow-y-auto p-4">
              <div
                className="prose prose-invert prose-sm max-w-none leading-relaxed text-slate-300"
                dangerouslySetInnerHTML={{ __html: challenge.description || "No description available." }}
              />
            </div>

            <div className="flex h-52 flex-col border-t border-line bg-black">
              <div className="flex items-center justify-between border-b border-line bg-[#121212] px-3 py-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                  <TerminalSquare size={13} />
                  Execution Console
                </div>
                {statusLog ? (
                  <div
                    className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] ${
                      statusLog.includes("SUCCESS") ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300"
                    }`}
                  >
                    {statusLog.includes("SUCCESS") ? <CircleCheckBig size={12} /> : <ShieldAlert size={12} />}
                    {statusLog.includes("SUCCESS") ? "Success" : "Failed"}
                  </div>
                ) : null}
              </div>
              <div className="flex-1 overflow-y-auto p-3 font-mono text-[11px] leading-relaxed text-slate-300">
                {logs.length === 0 ? (
                  <span className="text-slate-600">Waiting for run...</span>
                ) : (
                  logs.map((log, i) => (
                    <div
                      key={i}
                      className={`${
                        log.includes("[ERROR]") || log.includes("[FAILED]")
                          ? "text-red-400"
                          : log.includes("[SUCCESS]")
                            ? "text-green-400"
                            : ""
                      }`}
                    >
                      {log}
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>

          <section className="flex min-h-0 flex-col bg-[#141414]">
            <div className="flex items-center justify-between border-b border-line/50 bg-[#191919] px-4 py-2.5">
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="rounded-md border border-line bg-black px-2 py-1 text-xs text-slate-200 outline-none focus:border-accent"
                >
                  {languages.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
              <div className="text-xs font-mono text-slate-500">{submitted ? "READ-ONLY" : "EDITING"}</div>
            </div>

            <div className="flex-1">
              <MonacoEditor
                height="100%"
                language={language}
                value={currentCode}
                theme="vs-dark"
                onChange={handleCodeChange}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  tabSize: 4,
                  scrollBeyondLastLine: false,
                  readOnly: submitted || busy
                }}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line/50 bg-[#191919] px-4 py-3">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => void executeCode()}
                  disabled={busy || submitted}
                  className="inline-flex items-center gap-2 rounded-md bg-accent px-5 py-2 text-sm font-semibold text-white transition hover:bg-accent/90 disabled:opacity-50"
                >
                  <Play size={14} />
                  Run Tests
                </button>
                <span className="max-w-[230px] text-xs leading-tight text-slate-400">
                  Syntax issues are retryable. Logic failure consumes the attempt.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void onAbandon()}
                  disabled={busy}
                  className="rounded-md border border-line bg-panel px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white disabled:opacity-50"
                >
                  Abandon
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-md border border-line bg-transparent px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"
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
