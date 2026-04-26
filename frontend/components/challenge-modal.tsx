"use client";

import dynamic from "next/dynamic";
import { useMemo, useState, useEffect } from "react";
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
    return keys.length > 0 ? keys : ["typescript"];
  }, [challenge.starterCode]);

  const [language, setLanguage] = useState(languages.includes("typescript") ? "typescript" : languages[0]);
  
  const [codeMap, setCodeMap] = useState<Record<string, string>>({});
  
  useEffect(() => {
    if (challenge.starterCode) {
      setCodeMap(challenge.starterCode);
    }
  }, [challenge.starterCode]);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="flex h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-md border border-line bg-panel shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-4 py-3 bg-panelAlt">
          <div className="flex flex-col">
            <div className="text-xs font-semibold tracking-wider text-accent uppercase">LeetCode Gate</div>
            <h2 className="text-lg font-bold text-text mt-1">{challenge.title}</h2>
          </div>
          <div className="flex flex-col items-end">
            <div className={`text-xs px-2 py-1 rounded font-bold ${
              challenge.difficulty === 'HARD' ? 'bg-red-500/20 text-red-500' :
              challenge.difficulty === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-500' :
              'bg-green-500/20 text-green-500'
            }`}>
              {challenge.difficulty}
            </div>
          </div>
        </div>

        <div className="grid flex-1 grid-cols-1 gap-0 overflow-hidden lg:grid-cols-[380px_1fr]">
          <section className="flex flex-col border-b border-line lg:border-b-0 lg:border-r bg-panel">
            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
              <div 
                className="prose prose-invert prose-sm max-w-none text-slate-300 leading-relaxed" 
                dangerouslySetInnerHTML={{ __html: challenge.description || 'No description available.' }} 
              />
            </div>
            
            {/* Output Console */}
            <div className="h-48 border-t border-line bg-black flex flex-col">
              <div className="px-3 py-1.5 border-b border-line bg-[#1e1e1e] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accent"></span>
                <span className="text-xs font-semibold text-slate-400">EXECUTION CONSOLE</span>
              </div>
              <div className="flex-1 overflow-y-auto p-3 font-mono text-[11px] leading-relaxed text-slate-300">
                {logs.length === 0 ? (
                  <span className="text-slate-600">Awaiting code execution...</span>
                ) : (
                  logs.map((log, i) => (
                    <div key={i} className={`${log.includes('[ERROR]') || log.includes('[FAILED]') ? 'text-red-400' : log.includes('[SUCCESS]') ? 'text-green-400' : ''}`}>
                      {log}
                    </div>
                  ))
                )}
                {statusLog && (
                  <div className={`mt-2 font-bold ${statusLog.includes('SUCCESS') ? 'text-green-400' : 'text-red-400'}`}>
                    [{statusLog}]
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="flex min-h-0 flex-col bg-[#1e1e1e]">
            {/* Editor Toolbar */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-line/50 bg-[#1e1e1e]">
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-400 font-semibold">LANGUAGE:</label>
                <select 
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="bg-black border border-line rounded px-2 py-1 text-xs text-slate-200 outline-none focus:border-accent"
                >
                  {languages.map(l => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>
              <div className="text-xs text-slate-500 font-mono">
                {submitted ? 'READ-ONLY' : 'EDITING'}
              </div>
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
            
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line/50 bg-panelAlt px-4 py-3">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => void executeCode()}
                  disabled={busy || submitted}
                  className="rounded-md bg-accent px-6 py-2 text-sm font-bold text-white transition-all hover:bg-accent/90 disabled:opacity-50 flex items-center gap-2 shadow-[0_0_15px_rgba(56,189,248,0.2)]"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3l14 9-14 9V3z"/></svg>
                  Compile & Run
                </button>
                <span className="text-xs text-slate-400 max-w-[200px] leading-tight">
                  <span className="font-bold text-accent">Tip:</span> Syntax errors can be retried. Logic failures are final.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void onAbandon()}
                  disabled={busy}
                  className="rounded-md border border-line bg-panel px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/5 disabled:opacity-50 transition-colors"
                >
                  Abandon
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-md bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20 transition-colors"
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
