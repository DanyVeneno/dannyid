/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: { ink: "#1b2229", lime: { DEFAULT: "#84cc16", dark: "#65a30d" } },
      keyframes: { breathe: { "0%,100%": { transform: "scale(1)" }, "50%": { transform: "scale(1.05)" } } },
      animation: { breathe: "breathe 2s infinite" },
    },
  },
  plugins: [],
};
