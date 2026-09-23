import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)"],
        mono: ["var(--font-mono)"],
      },
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        surface2: "var(--surface-2)",
        border: "var(--border)",
        text: "var(--text)",
        "text-dim": "var(--text-dim)",
        "text-faint": "var(--text-faint)",
        accent: "var(--accent)",
        "accent-dim": "var(--accent-dim)",
        teal: "var(--teal)",
        "teal-dim": "var(--teal-dim)",
        danger: "var(--danger)",
      },
      borderRadius: {
        card: "18px",
      },
      boxShadow: {
        soft: "var(--shadow)",
        "soft-hover": "var(--shadow-hover)",
      },
    },
  },
  plugins: [],
};

export default config;
