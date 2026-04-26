import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        panel: "var(--panel)",
        panelAlt: "var(--panelAlt)",
        line: "var(--line)",
        text: "var(--text)",
        muted: "var(--muted)",
        ok: "var(--ok)",
        warn: "var(--warn)",
        bad: "var(--bad)",
        accent: "var(--accent)"
      }
    }
  },
  plugins: []
};

export default config;
