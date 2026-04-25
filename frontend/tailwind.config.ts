import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0b0f14",
        panel: "#141b24",
        panelAlt: "#1a2230",
        line: "#273245",
        text: "#e5ecf4",
        muted: "#95a3b8",
        ok: "#22c55e",
        warn: "#f59e0b",
        bad: "#ef4444",
        accent: "#38bdf8"
      }
    }
  },
  plugins: []
};

export default config;
