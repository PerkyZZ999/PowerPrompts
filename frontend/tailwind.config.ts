import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0a0a0a", // true dark gray
        foreground: "#f5f5f5", // light gray
        surface: "#1a1a1a", // dark gray surface
        elevated: "#2a2a2a", // elevated gray
        primary: {
          DEFAULT: "#bfff45",
          light: "#d4ff70",
          dark: "#a8e639",
          glow: "rgba(191, 255, 69, 0.5)",
        },
        accent: {
          white: "#ffffff",
          gray: {
            DEFAULT: "#64748b",
            light: "#94a3b8",
            dark: "#475569",
          },
        },
      },
      backgroundImage: {
        "grid-pattern":
          "linear-gradient(rgba(160, 160, 160, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(160, 160, 160, 0.05) 1px, transparent 1px)",
        "radial-glow":
          "radial-gradient(circle at center, rgba(191, 255, 69, 0.15), transparent 70%)",
      },
      boxShadow: {
        "neon-sm": "0 0 10px rgba(191, 255, 69, 0.3)",
        "neon-md": "0 0 20px rgba(191, 255, 69, 0.4)",
        "neon-lg": "0 0 30px rgba(191, 255, 69, 0.5)",
        "inner-glow": "inset 0 0 20px rgba(191, 255, 69, 0.1)",
      },
      animation: {
        "pulse-glow": "pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "scan-line": "scan-line 2s linear infinite",
        shimmer: "shimmer 2s linear infinite",
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 10px rgba(191, 255, 69, 0.3)" },
          "50%": { boxShadow: "0 0 20px rgba(191, 255, 69, 0.6)" },
        },
        "scan-line": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-1000px 0" },
          "100%": { backgroundPosition: "1000px 0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
