import type { Config } from "tailwindcss";

export default {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#1F363D",
        secondary: "#40798C",
        accent: "#70A9A1",
        surface: "#F4F7F6",
        brand: {
          dark: "#1F363D",      // Color sidebar y textos oscuros
          primary: "#40798C",   // Color principal / KPI card 1
          teal: "#70A9A1",      // KPI card 2 / Acentos
          sage: "#9EC1A3",      // KPI card 3 / Verde pastel
          light: "#CFE0C3",     // KPI card 4 / Menta suave
          surface: "#F4F7F6",   // Fondo global estilo dashboard
          card: "#FFFFFF",
          border: "#E2E8F0",
        },
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      fontFamily: {
        futura: ["Futura", "Futura PT", "Trebuchet MS", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
