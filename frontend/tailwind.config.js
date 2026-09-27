/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#08090D",
        surface: "#0F111A",
        surfaceBorder: "#1B2030",
        brand: {
          emerald: "#10B981",
          gold: "#F59E0B",
          bnb: "#F3BA2F",
          cyan: "#06B6D4"
        }
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"]
      }
    },
  },
  plugins: [],
}
