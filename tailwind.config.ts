import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/app/**/*.{ts,tsx}", "./src/components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "rgb(var(--color-background) / <alpha-value>)", surface: "rgb(var(--color-surface) / <alpha-value>)", border: "rgb(var(--color-border) / <alpha-value>)",
        primary: { DEFAULT: "rgb(var(--color-primary) / <alpha-value>)", foreground: "rgb(var(--color-primary-foreground) / <alpha-value>)" },
        solar: { DEFAULT: "rgb(var(--color-solar) / <alpha-value>)", foreground: "rgb(var(--color-solar-foreground) / <alpha-value>)" },
        energy: { DEFAULT: "rgb(var(--color-energy) / <alpha-value>)", foreground: "rgb(var(--color-energy-foreground) / <alpha-value>)" },
        danger: "rgb(var(--color-danger) / <alpha-value>)", muted: "rgb(var(--color-muted) / <alpha-value>)",
      },
      borderRadius: { xl: "1rem", "2xl": "1.25rem" },
      fontFamily: { sans: ["var(--font-sans)", "system-ui", "sans-serif"] },
      boxShadow: { glow: "0 12px 40px rgb(59 130 246 / .16)" },
    },
  }, plugins: [],
};
export default config;
