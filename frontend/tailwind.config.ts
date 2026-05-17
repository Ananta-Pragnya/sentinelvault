import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ["'JetBrains Mono'", "ui-monospace", "SFMono-Regular", "monospace"],
        sans: ["'JetBrains Mono'", "ui-monospace", "monospace"],
      },
      colors: {
        sv: {
          bg:       "#0c0c0c",
          surface:  "#111111",
          raised:   "#161616",
          border:   "#222222",
          line:     "#2e2e2e",
          live:     "#00e676",
          "live-dim": "#00331a",
          red:      "#ff4444",
          "red-dim":  "#1a0000",
          orange:   "#ff8c42",
          "orange-dim": "#1a0800",
          yellow:   "#e6c340",
          "yellow-dim": "#1a1500",
          text:     "#f5f5f5",
          dim:      "#888888",
          muted:    "#444444",
        },
      },
      animation: {
        "ticker":  "bb-ticker 60s linear infinite",
        "blink":   "bb-blink 1.4s step-end infinite",
        "slide-up":"bb-slide-up 0.25s ease forwards",
      },
      keyframes: {
        "bb-ticker": {
          "0%":   { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "bb-blink": {
          "0%,100%": { opacity: "1" },
          "50%":     { opacity: "0" },
        },
        "bb-slide-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
