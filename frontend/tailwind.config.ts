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
        sans: ["'Inter'", "system-ui", "sans-serif"],
      },
      colors: {
        sv: {
          bg:       "#09090A",
          surface:  "#111113",
          raised:   "#18181B",
          border:   "#27272A",
          line:     "#3F3F46",
          amber:    "#F59E0B",
          "amber-2": "#D97706",
          "amber-dim": "rgba(245,158,11,0.12)",
          red:      "#EF4444",
          "red-dim":  "rgba(239,68,68,0.12)",
          orange:   "#F97316",
          "orange-dim": "rgba(249,115,22,0.12)",
          yellow:   "#EAB308",
          "yellow-dim": "rgba(234,179,8,0.12)",
          green:    "#22C55E",
          "green-dim":  "rgba(34,197,94,0.12)",
          text:     "#FAFAFA",
          dim:      "#A1A1AA",
          muted:    "#52525B",
          ghost:    "#27272A",
        },
      },
      animation: {
        "ticker":     "ticker 40s linear infinite",
        "flicker":    "flicker 8s ease-in-out infinite",
        "pulse-dot":  "pulse-dot 2s ease-in-out infinite",
        "slide-up":   "slide-up 0.4s cubic-bezier(0.16,1,0.3,1) forwards",
        "fade-in":    "fade-in 0.6s ease forwards",
        "scan":       "scan 3s ease-in-out infinite",
        "count-up":   "count-up 0.3s ease forwards",
        "blink":      "blink 1s step-end infinite",
      },
      keyframes: {
        ticker: {
          "0%":   { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        flicker: {
          "0%,100%": { opacity: "1" },
          "92%":     { opacity: "1" },
          "93%":     { opacity: "0.6" },
          "94%":     { opacity: "1" },
          "96%":     { opacity: "0.8" },
          "97%":     { opacity: "1" },
        },
        "pulse-dot": {
          "0%,100%": { opacity: "1", transform: "scale(1)" },
          "50%":     { opacity: "0.4", transform: "scale(0.8)" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
        scan: {
          "0%,100%": { transform: "translateY(-100%)" },
          "50%":     { transform: "translateY(400%)" },
        },
        "count-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        blink: {
          "0%,100%": { opacity: "1" },
          "50%":     { opacity: "0" },
        },
      },
      backgroundImage: {
        "grid-pattern": "linear-gradient(rgba(245,158,11,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(245,158,11,0.03) 1px,transparent 1px)",
        "noise": "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E\")",
      },
      backgroundSize: {
        "grid": "40px 40px",
      },
    },
  },
  plugins: [],
};

export default config;
