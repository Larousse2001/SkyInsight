/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0a0a0f",
        surface: "#11121a",
        surfaceAlt: "#181a25",
        border: "#252836",
        accent: "#6366f1",
        accent2: "#22d3ee",
        success: "#10b981",
        danger: "#ef4444",
        warning: "#f59e0b",
        muted: "#8b8fa3",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 40px -10px rgba(99, 102, 241, 0.45)",
      },
    },
  },
  plugins: [],
};
