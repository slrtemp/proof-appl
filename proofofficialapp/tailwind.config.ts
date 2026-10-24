import type { Config } from "tailwindcss";
import forms from "@tailwindcss/forms";

const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#0A0A0B",
        surface: "#111113",
        elevated: "#17171A",
        border: "rgba(255,255,255,0.08)",
        foreground: "#EDEDEF",
        muted: "#8A8A93",
        accent: "#6366F1",
      },
      borderRadius: { card: "16px", control: "10px" },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      keyframes: {
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        shimmer: "shimmer 1.8s ease-in-out infinite",
      },
    },
  },
  plugins: [forms],
};

export default config;
